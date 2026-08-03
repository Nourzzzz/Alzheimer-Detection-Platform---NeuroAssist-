package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Dto.AiAssessmentResponseDto;
import com.alzheimer.diagnosis_service.Dto.CnnResultDto;
import com.alzheimer.diagnosis_service.Dto.PatientAssessmentView;
import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import com.alzheimer.diagnosis_service.Entities.MRIScan;
import com.alzheimer.diagnosis_service.Entities.MriScanStatus;
import com.alzheimer.diagnosis_service.Entities.ValidationStatus;
import com.alzheimer.diagnosis_service.Repositories.AIAssessmentRepository;
import com.alzheimer.diagnosis_service.Repositories.ClinicalRecordRepository;
import com.alzheimer.diagnosis_service.Repositories.MRIScanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MriService {

    private static final List<ValidationStatus> PATIENT_VISIBLE_STATUSES =
            List.of(ValidationStatus.VALIDATED, ValidationStatus.CORRECTED, ValidationStatus.REJECTED);

    private final MRIScanRepository mriScanRepository;
    private final AIAssessmentRepository aiAssessmentRepository;
    private final MriStorageService mriStorageService;
    private final AiServiceClient aiServiceClient;
    private final AssessmentPipelineService assessmentPipelineService;
    private final ClinicalRecordRepository clinicalRecordRepository;
    private final com.alzheimer.diagnosis_service.Client.QuestionnaireServiceClient questionnaireServiceClient;

    public AIAssessment uploadAndAnalyze(String patientEmail, String doctorEmail, MultipartFile file,
                                        String clinicalNote, String lang) {
        boolean missingClinicalRecord = !clinicalRecordRepository.existsByPatientEmail(patientEmail);
        boolean missingCognitiveQuestionnaire = isCognitiveQuestionnaireMissing(patientEmail);
        if (missingClinicalRecord || missingCognitiveQuestionnaire) {
            throw new com.alzheimer.diagnosis_service.Exception.ClinicalDataRequiredException(
                    missingClinicalRecord, missingCognitiveQuestionnaire);
        }

        MRIScan scan = MRIScan.builder()
                .patientEmail(patientEmail)
                .doctorEmail(doctorEmail)
                .originalFilename(file.getOriginalFilename())
                .fileSizeBytes(file.getSize())
                .contentType(file.getContentType())
                .status(MriScanStatus.PROCESSING)
                .uploadedAt(LocalDateTime.now())
                .build();

        try {
            String storedPath = mriStorageService.store(patientEmail, file);
            scan.setStoredFilePath(storedPath);
        } catch (IOException e) {
            scan.setStatus(MriScanStatus.FAILED);
            mriScanRepository.save(scan);
            throw new RuntimeException("Could not store MRI file: " + e.getMessage());
        }

        CnnResultDto cnnResult;
        try {
            cnnResult = aiServiceClient.predictMri(readBytes(file), file.getOriginalFilename());
        } catch (Exception e) {
            log.error("CNN inference call to ai-service failed", e);
            scan.setStatus(MriScanStatus.FAILED);
            mriScanRepository.save(scan);
            throw new RuntimeException("AI inference failed: " + e.getMessage());
        }

        scan.setStatus(MriScanStatus.PROCESSED);
        mriScanRepository.save(scan);

        double riskScore = computeRiskScore(cnnResult.getProbabilities());

        AIAssessment assessment = AIAssessment.builder()
                .mriScanId(scan.getId())
                .patientEmail(patientEmail)
                .doctorEmail(doctorEmail)
                .cnnResult(AIAssessment.CnnResult.builder()
                        .predictedClass(cnnResult.getPredictedClass())
                        .confidence(cnnResult.getConfidence())
                        .probabilities(cnnResult.getProbabilities())
                        .build())
                .riskScore(riskScore)
                .stage(cnnResult.getPredictedClass())
                .gradCamImagePath(storeGradCamIfPresent(patientEmail, cnnResult.getGradcamImageBase64()))
                .validationStatus(ValidationStatus.NOT_READY)
                .createdAt(LocalDateTime.now())
                .build();
        assessment = aiAssessmentRepository.save(assessment);

        return assessmentPipelineService.runPostCnnPipeline(assessment, clinicalNote, lang);
    }

    private boolean isCognitiveQuestionnaireMissing(String patientEmail) {
        try {
            var cognitive = questionnaireServiceClient.getLatestCognitive(patientEmail);
            return cognitive == null || !cognitive.isExists();
        } catch (Exception e) {
            log.warn("Could not check cognitive questionnaire for {} ({}); not blocking the upload",
                    patientEmail, e.getMessage());
            return false;
        }
    }

    public List<AiAssessmentResponseDto> history(String patientEmail) {
        return aiAssessmentRepository.findByPatientEmailOrderByCreatedAtDesc(patientEmail)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<PatientAssessmentView> patientResults(String patientEmail, String lang) {
        return aiAssessmentRepository
                .findByPatientEmailAndValidationStatusInOrderByCreatedAtDesc(patientEmail, PATIENT_VISIBLE_STATUSES)
                .stream()
                .map(a -> toPatientView(a, lang))
                .toList();
    }

    private double computeRiskScore(Map<String, Double> probabilities) {
        double pMci = probabilities.getOrDefault("MCI", 0.0);
        double pAd = probabilities.getOrDefault("AD", 0.0);
        double score = (0.5 * pMci + 1.0 * pAd) * 100;
        return Math.round(score * 10.0) / 10.0;
    }

    private String storeGradCamIfPresent(String patientEmail, String gradcamImageBase64) {
        if (gradcamImageBase64 == null || gradcamImageBase64.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(gradcamImageBase64);
            return mriStorageService.storeBytes(patientEmail, "gradcam.png", bytes);
        } catch (Exception e) {
            log.warn("Could not store Grad-CAM image for {}: {}", patientEmail, e.getMessage());
            return null;
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Could not read uploaded file: " + e.getMessage());
        }
    }

    public AiAssessmentResponseDto toDto(AIAssessment a) {
        return AiAssessmentResponseDto.builder()
                .id(a.getId())
                .mriScanId(a.getMriScanId())
                .patientEmail(a.getPatientEmail())
                .cnnResult(CnnResultDto.builder()
                        .predictedClass(a.getCnnResult().getPredictedClass())
                        .confidence(a.getCnnResult().getConfidence())
                        .probabilities(a.getCnnResult().getProbabilities())
                        .build())
                .riskScore(a.getRiskScore())
                .stage(a.getStage())
                .hasGradCam(a.getGradCamImagePath() != null)
                .validationStatus(a.getValidationStatus().name())
                .correctedStage(a.getCorrectedStage())
                .createdAt(a.getCreatedAt())
                .build();
    }

    public PatientAssessmentView toPatientView(AIAssessment a, String lang) {
        boolean reviewed = PATIENT_VISIBLE_STATUSES.contains(a.getValidationStatus());
        String finalStage = null;
        AIAssessment.ResolvedGuidance guidance = null;
        if (reviewed && a.getValidationStatus() != ValidationStatus.REJECTED) {
            finalStage = a.getCorrectedStage() != null ? a.getCorrectedStage() : a.getStage();
            guidance = a.resolveGuidance(lang);
        }
        return PatientAssessmentView.builder()
                .id(a.getId())
                .validationStatus(a.getValidationStatus().name())
                .finalStage(finalStage)
                .doctorComment(reviewed ? a.getDoctorComment() : null)
                .guidance(guidance == null ? null : guidance.text())
                .guidanceLang(guidance == null ? null : guidance.lang())
                .hasGradCam(reviewed && a.getGradCamImagePath() != null)
                .createdAt(a.getCreatedAt())
                .validatedAt(a.getValidatedAt())
                .build();
    }
}
