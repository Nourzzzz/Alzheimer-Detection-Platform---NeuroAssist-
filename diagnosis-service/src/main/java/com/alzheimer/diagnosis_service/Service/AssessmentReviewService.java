package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Dto.AssessmentDetailDto;
import com.alzheimer.diagnosis_service.Dto.AssessmentSummaryDto;
import com.alzheimer.diagnosis_service.Dto.CnnResultDto;
import com.alzheimer.diagnosis_service.Dto.ValidationRequestDto;
import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import com.alzheimer.diagnosis_service.Entities.ValidationStatus;
import com.alzheimer.diagnosis_service.Repositories.AIAssessmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AssessmentReviewService {

    private static final Set<String> VALID_STAGES = Set.of("CN", "MCI", "AD");

    /** Hard cap on AI re-drafts, so a doctor can never loop with the model forever. */
    public static final int MAX_REVISIONS = 3;

    private final AIAssessmentRepository aiAssessmentRepository;
    private final AssessmentPipelineService assessmentPipelineService;

    public List<AssessmentSummaryDto> pendingQueue(String doctorEmail) {
        return aiAssessmentRepository
                .findByDoctorEmailAndValidationStatusOrderByCreatedAtDesc(doctorEmail, ValidationStatus.PENDING_VALIDATION)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public AssessmentDetailDto detail(String id, String lang) {
        return toDetail(load(id), lang);
    }

    public AssessmentDetailDto validate(String id, String doctorEmail, ValidationRequestDto request, String lang) {
        AIAssessment assessment = load(id);

        if ("REQUEST_REVISION".equals(safeUpper(request.getAction()))) {
            return requestRevision(assessment, doctorEmail, request, lang);
        }

        ValidationStatus newStatus = switch (safeUpper(request.getAction())) {
            case "VALIDATE" -> ValidationStatus.VALIDATED;
            case "CORRECT" -> ValidationStatus.CORRECTED;
            case "REJECT" -> ValidationStatus.REJECTED;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Unknown validation action: " + request.getAction());
        };

        if (newStatus == ValidationStatus.CORRECTED) {
            String corrected = request.getCorrectedStage();
            if (corrected == null || !VALID_STAGES.contains(corrected.toUpperCase())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "CORRECT requires a valid correctedStage (CN | MCI | AD)");
            }
            assessment.setCorrectedStage(corrected.toUpperCase());
        }

        assessment.setValidationStatus(newStatus);
        assessment.setDoctorComment(request.getComment());
        if (request.getEditedReport() != null && !request.getEditedReport().isBlank()) {
            assessment.setEditedReport(request.getEditedReport());
        }
        applyGuidanceEdit(assessment, request.getPatientGuidance(), lang);
        assessment.setValidatedByEmail(doctorEmail);
        assessment.setValidatedAt(LocalDateTime.now());

        return toDetail(aiAssessmentRepository.save(assessment), lang);
    }

    /**
     * Archives the rejected draft with the physician's reason, then asks the AI
     * for a new one that answers it. The assessment lands back in the validation
     * queue; the patient sees nothing during these rounds.
     */
    private AssessmentDetailDto requestRevision(AIAssessment assessment, String doctorEmail,
                                                ValidationRequestDto request, String lang) {
        String feedback = request.getComment();
        if (feedback == null || feedback.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "REQUEST_REVISION requires a comment explaining what to correct");
        }
        if (assessment.getRevisions() != null && assessment.getRevisions().size() >= MAX_REVISIONS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This assessment already reached the maximum of " + MAX_REVISIONS
                            + " AI revisions. Validate, correct or reject it.");
        }

        String rejectedReport = assessment.getEditedReport() != null && !assessment.getEditedReport().isBlank()
                ? assessment.getEditedReport()
                : assessment.getGeneratedReport();

        if (assessment.getRevisions() == null) {
            assessment.setRevisions(new ArrayList<>());
        }
        assessment.getRevisions().add(AIAssessment.Revision.builder()
                .round(assessment.getRevisions().size() + 1)
                .rejectedReport(rejectedReport)
                .doctorFeedback(feedback)
                .requestedByEmail(doctorEmail)
                .requestedAt(LocalDateTime.now())
                .build());

        assessment.setDoctorComment(feedback);
        assessment.setEditedReport(null);
        assessment.setValidationStatus(ValidationStatus.REVISION_REQUESTED);
        aiAssessmentRepository.save(assessment);

        AIAssessment regenerated =
                assessmentPipelineService.regenerateWithFeedback(assessment, feedback, rejectedReport, lang);
        return toDetail(regenerated, lang);
    }

    /**
     * Records a guidance edit only when the doctor actually changed something.
     *
     * <p>The review form pre-fills the field with the AI draft and posts it back
     * on every validation. Storing that as a review would mark the doctor's
     * language as the only approved one and permanently pin the patient to it,
     * even though nothing was edited. Submitting text identical to the draft
     * also clears any earlier edit, so reverting works.
     */
    private void applyGuidanceEdit(AIAssessment assessment, String submitted, String lang) {
        if (submitted == null || submitted.isBlank()) {
            return;
        }
        if (assessment.getEditedGuidanceByLang() == null) {
            assessment.setEditedGuidanceByLang(new HashMap<>());
        }
        if (sameText(submitted, generatedGuidanceFor(assessment, lang))) {
            assessment.getEditedGuidanceByLang().remove(lang);
            return;
        }
        assessment.getEditedGuidanceByLang().put(lang, submitted);
    }

    private String generatedGuidanceFor(AIAssessment assessment, String lang) {
        java.util.Map<String, String> byLang = assessment.getPatientGuidanceByLang();
        if (byLang != null) {
            String generated = byLang.get(lang);
            if (generated != null && !generated.isBlank()) {
                return generated;
            }
        }
        return assessment.getPatientGuidance();
    }

    private boolean sameText(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return a.strip().replaceAll("\\s+", " ").equals(b.strip().replaceAll("\\s+", " "));
    }

    private AIAssessment load(String id) {
        return aiAssessmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found: " + id));
    }

    private String safeUpper(String s) {
        return s == null ? "" : s.trim().toUpperCase();
    }

    private AssessmentSummaryDto toSummary(AIAssessment a) {
        return AssessmentSummaryDto.builder()
                .id(a.getId())
                .patientEmail(a.getPatientEmail())
                .stage(a.getStage())
                .riskScore(a.getRiskScore())
                .confidence(a.getCnnResult() != null ? a.getCnnResult().getConfidence() : 0.0)
                .validationStatus(a.getValidationStatus().name())
                .createdAt(a.getCreatedAt())
                .build();
    }

    /** The doctor reviews in their own language; an older single-language
     *  assessment falls back to whatever text it holds. */
    private String guidanceFor(java.util.Map<String, String> byLang, String legacy, String lang) {
        if (byLang == null || byLang.isEmpty()) {
            return legacy;
        }
        String exact = byLang.get(lang);
        return exact != null && !exact.isBlank() ? exact : legacy;
    }

    private AssessmentDetailDto toDetail(AIAssessment a, String lang) {
        CnnResultDto cnn = a.getCnnResult() == null ? null : CnnResultDto.builder()
                .predictedClass(a.getCnnResult().getPredictedClass())
                .confidence(a.getCnnResult().getConfidence())
                .probabilities(a.getCnnResult().getProbabilities())
                .build();
        return AssessmentDetailDto.builder()
                .id(a.getId())
                .mriScanId(a.getMriScanId())
                .patientEmail(a.getPatientEmail())
                .doctorEmail(a.getDoctorEmail())
                .cnnResult(cnn)
                .riskScore(a.getRiskScore())
                .stage(a.getStage())
                .hasGradCam(a.getGradCamImagePath() != null)
                .clinicalBertExtraction(a.getClinicalBertExtraction())
                .ragContextRefs(a.getRagContextRefs())
                .generatedReport(a.getGeneratedReport())
                .editedReport(a.getEditedReport())
                .patientGuidance(guidanceFor(a.getPatientGuidanceByLang(), a.getPatientGuidance(), lang))
                .editedGuidance(guidanceFor(a.getEditedGuidanceByLang(), a.getEditedGuidance(), lang))
                .revisions(a.getRevisions())
                .revisionsRemaining(MAX_REVISIONS - (a.getRevisions() == null ? 0 : a.getRevisions().size()))
                .validationStatus(a.getValidationStatus().name())
                .correctedStage(a.getCorrectedStage())
                .doctorComment(a.getDoctorComment())
                .validatedByEmail(a.getValidatedByEmail())
                .validatedAt(a.getValidatedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
