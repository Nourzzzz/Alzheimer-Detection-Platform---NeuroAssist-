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
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AssessmentReviewService {

    private static final Set<String> VALID_STAGES = Set.of("CN", "MCI", "AD");

    private final AIAssessmentRepository aiAssessmentRepository;

    public List<AssessmentSummaryDto> pendingQueue(String doctorEmail) {
        return aiAssessmentRepository
                .findByDoctorEmailAndValidationStatusOrderByCreatedAtDesc(doctorEmail, ValidationStatus.PENDING_VALIDATION)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public AssessmentDetailDto detail(String id) {
        return toDetail(load(id));
    }

    public AssessmentDetailDto validate(String id, String doctorEmail, ValidationRequestDto request) {
        AIAssessment assessment = load(id);

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
        assessment.setValidatedByEmail(doctorEmail);
        assessment.setValidatedAt(LocalDateTime.now());

        return toDetail(aiAssessmentRepository.save(assessment));
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

    private AssessmentDetailDto toDetail(AIAssessment a) {
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
                .validationStatus(a.getValidationStatus().name())
                .correctedStage(a.getCorrectedStage())
                .doctorComment(a.getDoctorComment())
                .validatedByEmail(a.getValidatedByEmail())
                .validatedAt(a.getValidatedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
