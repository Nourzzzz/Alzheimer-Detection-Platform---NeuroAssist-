package com.alzheimer.questionnaire_service.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnswerDto {

    @NotBlank(message = "L'identifiant de la question est obligatoire")
    private String questionId;

    @Min(value = 0, message = "La valeur doit être comprise entre 0 et 3")
    @Max(value = 3, message = "La valeur doit être comprise entre 0 et 3")
    private int value;
}
