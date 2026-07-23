package com.alzheimer.questionnaire_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class QuestionnaireResultResponse {
    private String id;
    private int score;
    private int maxScore;
    private String riskBucket;
    private LocalDateTime createdAt;
}
