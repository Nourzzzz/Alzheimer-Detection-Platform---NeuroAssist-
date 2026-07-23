package com.alzheimer.questionnaire_service.Entities;

import com.alzheimer.questionnaire_service.Dto.AiCognitiveQuestionDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "cognitive_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CognitiveSession {

    @Id
    private String id;

    private String patientEmail;

    private Map<String, Object> state;
    private AiCognitiveQuestionDto lastQuestion;

    private boolean finished;
    private Map<String, Object> summary;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
