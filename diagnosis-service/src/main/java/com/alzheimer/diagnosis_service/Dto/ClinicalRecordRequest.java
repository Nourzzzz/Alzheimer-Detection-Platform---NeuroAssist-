package com.alzheimer.diagnosis_service.Dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClinicalRecordRequest {

    @NotBlank(message = "Symptoms are required")
    private String symptoms;

    @NotBlank(message = "Medical history is required")
    private String medicalHistory;

    @NotBlank(message = "Treatments are required")
    private String treatments;

    @NotBlank(message = "Observations are required")
    private String observations;

    private String cognitiveScores;
}
