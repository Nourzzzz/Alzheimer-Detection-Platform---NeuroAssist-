package com.alzheimer.questionnaire_service.Dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CognitiveAnswerRequest {
    @NotBlank
    private String answer;
}
