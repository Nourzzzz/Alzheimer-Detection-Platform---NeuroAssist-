package com.alzheimer.questionnaire_service.Dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class CognitiveTurnResponse {
    private String sessionId;
    private boolean finished;
    private AiCognitiveQuestionDto question;
    private Map<String, Object> summary;
}
