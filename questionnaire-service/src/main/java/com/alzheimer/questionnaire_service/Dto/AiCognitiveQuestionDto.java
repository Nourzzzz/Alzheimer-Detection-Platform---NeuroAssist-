package com.alzheimer.questionnaire_service.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCognitiveQuestionDto {

    @JsonProperty("node_id")
    private String nodeId;

    private String text;

    @JsonProperty("answer_type")
    private String answerType;

    private List<AiCognitiveOptionDto> options;

    @JsonProperty("is_follow_up")
    private boolean followUp;

    @JsonProperty("forced_choice")
    private boolean forcedChoice;
}
