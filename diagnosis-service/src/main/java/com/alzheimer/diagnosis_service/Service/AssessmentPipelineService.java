package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Client.QuestionnaireServiceClient;
import com.alzheimer.diagnosis_service.Dto.AssessmentGenerationRequest;
import com.alzheimer.diagnosis_service.Dto.AssessmentGenerationResponse;
import com.alzheimer.diagnosis_service.Dto.QuestionnaireSummaryDto;
import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import com.alzheimer.diagnosis_service.Entities.ValidationStatus;
import com.alzheimer.diagnosis_service.Repositories.AIAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentPipelineService {

    private final AiServiceClient aiServiceClient;
    private final QuestionnaireServiceClient questionnaireServiceClient;
    private final AIAssessmentRepository aiAssessmentRepository;
    private final ClinicalRecordService clinicalRecordService;

    public AIAssessment runPostCnnPipeline(AIAssessment assessment, String clinicalNote) {
        String patientEmail = assessment.getPatientEmail();
        List<String> questionnaireAnswers = fetchQuestionnaireAnswers(patientEmail);

        String recordNote = clinicalRecordService.buildClinicalNote(patientEmail);
        String effectiveNote = (recordNote != null && !recordNote.isBlank())
                ? recordNote
                : (clinicalNote == null ? "" : clinicalNote);

        try {
            AssessmentGenerationRequest.AssessmentGenerationRequestBuilder builder =
                    AssessmentGenerationRequest.builder()
                    .predictedClass(assessment.getCnnResult().getPredictedClass())
                    .probabilities(assessment.getCnnResult().getProbabilities())
                    .riskScore(assessment.getRiskScore())
                    .mriFeatures(List.of())
                    .questionnaireAnswers(questionnaireAnswers)
                    .clinicalNote(effectiveNote);

            applyCognitiveSummary(builder, patientEmail);
            AssessmentGenerationRequest request = builder.build();

            AssessmentGenerationResponse response = aiServiceClient.generateAssessment(request);
            applyResponse(assessment, response);
        } catch (Exception e) {
            log.error("RAG/LLM assessment generation failed for assessment {} - advancing to "
                    + "PENDING_VALIDATION without RAG outputs", assessment.getId(), e);
        }

        assessment.setValidationStatus(ValidationStatus.PENDING_VALIDATION);
        return aiAssessmentRepository.save(assessment);
    }

    private void applyResponse(AIAssessment assessment, AssessmentGenerationResponse response) {
        if (response == null) {
            return;
        }
        if (response.getClinicalBert() != null) {
            assessment.setClinicalBertExtraction(AIAssessment.ClinicalBertExtraction.builder()
                    .symptoms(response.getClinicalBert().getSymptoms())
                    .treatments(response.getClinicalBert().getTreatments())
                    .conditions(response.getClinicalBert().getConditions())
                    .history(response.getClinicalBert().getHistory())
                    .build());
        }
        if (response.getRagContext() != null) {
            List<AIAssessment.RagContextRef> refs = new ArrayList<>();
            for (AssessmentGenerationResponse.RagContext c : response.getRagContext()) {
                refs.add(AIAssessment.RagContextRef.builder()
                        .source(c.getSource())
                        .docId(c.getDocId())
                        .snippet(c.getSnippet())
                        .score(c.getScore())
                        .build());
            }
            assessment.setRagContextRefs(refs);
        }
        assessment.setGeneratedReport(response.getReport());
    }

    private void applyCognitiveSummary(AssessmentGenerationRequest.AssessmentGenerationRequestBuilder builder, String patientEmail) {
        try {
            var cognitive = questionnaireServiceClient.getLatestCognitive(patientEmail);
            if (cognitive != null && cognitive.isExists()) {
                builder.cognitiveSummary(cognitive.getNarrative())
                        .cognitiveRiskLevel(cognitive.getGlobalRisk() != null ? cognitive.getGlobalRisk().getLevel() : null)
                        .cognitiveRedFlags(cognitive.getRedFlags());
            }
        } catch (Exception e) {
            log.warn("Could not fetch cognitive questionnaire summary for {}: {}", patientEmail, e.getMessage());
        }
    }

    private List<String> fetchQuestionnaireAnswers(String patientEmail) {
        if (patientEmail == null) {
            return List.of();
        }
        try {
            QuestionnaireSummaryDto summary = questionnaireServiceClient.getLatestAnswers(patientEmail);
            return summary != null && summary.getAnswers() != null ? summary.getAnswers() : List.of();
        } catch (Exception e) {
            log.warn("Could not fetch questionnaire answers for {}: {}", patientEmail, e.getMessage());
            return List.of();
        }
    }
}
