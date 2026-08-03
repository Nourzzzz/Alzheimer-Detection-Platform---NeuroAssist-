package com.alzheimer.questionnaire_service.Dto;

import lombok.Builder;
import lombok.Data;

/** Patient-facing turn: never carries the scored summary. */
@Data
@Builder
public class CognitiveTurnResponse {
    private String sessionId;
    private boolean finished;
    private AiCognitiveQuestionDto question;
}
