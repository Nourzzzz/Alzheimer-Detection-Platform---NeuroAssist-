package com.alzheimer.diagnosis_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidationRequestDto {
    private String action;
    private String comment;
    private String correctedStage;
    private String editedReport;
}
