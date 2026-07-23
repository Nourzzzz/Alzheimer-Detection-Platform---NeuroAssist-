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
public class PatientAssessmentView {
    private String id;
    private String validationStatus;
    private String message;

    private String finalStage;
    private String doctorComment;
    private String report;
    private boolean hasGradCam;
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
}
