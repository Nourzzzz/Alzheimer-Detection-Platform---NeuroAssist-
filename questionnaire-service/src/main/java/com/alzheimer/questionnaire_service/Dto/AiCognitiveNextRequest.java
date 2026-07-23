package com.alzheimer.questionnaire_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiCognitiveNextRequest {
    private Map<String, Object> state;
    private String answer;
}
