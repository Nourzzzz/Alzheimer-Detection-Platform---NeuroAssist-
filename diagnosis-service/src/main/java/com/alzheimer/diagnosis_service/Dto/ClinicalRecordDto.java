package com.alzheimer.diagnosis_service.Dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClinicalRecordDto {
    private String id;
    private String patientEmail;
    private String symptoms;
    private String medicalHistory;
    private String treatments;
    private String observations;
    private String cognitiveScores;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
