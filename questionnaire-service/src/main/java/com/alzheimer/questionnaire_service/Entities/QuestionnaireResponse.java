package com.alzheimer.questionnaire_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "questionnaire_responses")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireResponse {

    @Id
    private String id;

    private String patientEmail;
    private List<QuestionAnswer> answers;
    private int score;
    private int maxScore;
    private String riskBucket;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
