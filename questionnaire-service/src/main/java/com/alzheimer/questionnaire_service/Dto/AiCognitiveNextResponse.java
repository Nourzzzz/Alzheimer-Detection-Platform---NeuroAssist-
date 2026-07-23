package com.alzheimer.questionnaire_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCognitiveNextResponse {
    private Map<String, Object> state;
    private boolean finished;
    private AiCognitiveQuestionDto question;
    private Map<String, Object> summary;
}
