package com.alzheimer.diagnosis_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAssessmentResponseDto {
    private String id;
    private String mriScanId;
    private String patientEmail;
    private CnnResultDto cnnResult;
    private double riskScore;
    private String stage;
    private boolean hasGradCam;
    private String validationStatus;
    private String correctedStage;
    private LocalDateTime createdAt;
}
