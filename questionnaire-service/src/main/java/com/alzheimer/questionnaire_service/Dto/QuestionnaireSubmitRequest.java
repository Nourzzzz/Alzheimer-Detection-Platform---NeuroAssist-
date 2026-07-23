package com.alzheimer.questionnaire_service.Dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class QuestionnaireSubmitRequest {

    @NotEmpty(message = "Les réponses sont obligatoires")
    private List<@Valid AnswerDto> answers;
}
