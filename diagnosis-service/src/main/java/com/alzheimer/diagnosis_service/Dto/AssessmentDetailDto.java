package com.alzheimer.diagnosis_service.Dto;

import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentDetailDto {
    private String id;
    private String mriScanId;
    private String patientEmail;
    private String doctorEmail;

    private CnnResultDto cnnResult;
    private double riskScore;
    private String stage;
    private boolean hasGradCam;

    private AIAssessment.ClinicalBertExtraction clinicalBertExtraction;
    private List<AIAssessment.RagContextRef> ragContextRefs;
    private String generatedReport;
    private String editedReport;

    private String patientGuidance;
    private String editedGuidance;
    private List<AIAssessment.Revision> revisions;
    private int revisionsRemaining;

    private String validationStatus;
    private String correctedStage;
    private String doctorComment;
    private String validatedByEmail;
    private LocalDateTime validatedAt;
    private LocalDateTime createdAt;
}
