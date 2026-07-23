package com.alzheimer.diagnosis_service.Controllers;

import com.alzheimer.diagnosis_service.Dto.AssessmentDetailDto;
import com.alzheimer.diagnosis_service.Dto.AssessmentSummaryDto;
import com.alzheimer.diagnosis_service.Dto.ValidationRequestDto;
import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import com.alzheimer.diagnosis_service.Entities.ValidationStatus;
import com.alzheimer.diagnosis_service.Repositories.AIAssessmentRepository;
import com.alzheimer.diagnosis_service.Service.AssessmentReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medecin/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AIAssessmentRepository aiAssessmentRepository;
    private final AssessmentReviewService assessmentReviewService;

    @GetMapping("/pending")
    public ResponseEntity<List<AssessmentSummaryDto>> pending() {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(assessmentReviewService.pendingQueue(doctorEmail));
    }

    @GetMapping("/pending/count")
    public ResponseEntity<Map<String, Long>> pendingCount() {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        long count = aiAssessmentRepository.countByDoctorEmailAndValidationStatus(
                doctorEmail, ValidationStatus.PENDING_VALIDATION);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentDetailDto> detail(@PathVariable String id) {
        return ResponseEntity.ok(assessmentReviewService.detail(id));
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<AssessmentDetailDto> validate(@PathVariable String id,
                                                        @RequestBody ValidationRequestDto request) {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(assessmentReviewService.validate(id, doctorEmail, request));
    }

    @GetMapping(value = "/{id}/gradcam", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<FileSystemResource> gradcam(@PathVariable String id) {
        AIAssessment assessment = aiAssessmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Assessment not found"));

        if (assessment.getGradCamImagePath() == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(assessment.getGradCamImagePath());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(new FileSystemResource(file));
    }
}
