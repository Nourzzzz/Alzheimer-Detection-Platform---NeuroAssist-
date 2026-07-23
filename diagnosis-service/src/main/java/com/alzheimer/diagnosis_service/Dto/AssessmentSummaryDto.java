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
public class AssessmentSummaryDto {
    private String id;
    private String patientEmail;
    private String stage;
    private double riskScore;
    private double confidence;
    private String validationStatus;
    private LocalDateTime createdAt;
}
