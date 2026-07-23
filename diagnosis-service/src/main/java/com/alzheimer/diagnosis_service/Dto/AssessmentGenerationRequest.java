package com.alzheimer.diagnosis_service.Dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentGenerationRequest {

    @JsonProperty("predicted_class")
    private String predictedClass;

    private Map<String, Double> probabilities;

    @JsonProperty("risk_score")
    private double riskScore;

    @JsonProperty("mri_features")
    private List<String> mriFeatures;

    @JsonProperty("questionnaire_answers")
    private List<String> questionnaireAnswers;

    @JsonProperty("clinical_note")
    private String clinicalNote;

    @JsonProperty("cognitive_summary")
    private String cognitiveSummary;

    @JsonProperty("cognitive_risk_level")
    private String cognitiveRiskLevel;

    @JsonProperty("cognitive_red_flags")
    private List<String> cognitiveRedFlags;
}
