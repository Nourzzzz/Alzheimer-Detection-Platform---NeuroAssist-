package com.alzheimer.diagnosis_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CnnResultDto {

    @com.fasterxml.jackson.annotation.JsonProperty("predicted_class")
    private String predictedClass;

    private double confidence;

    private Map<String, Double> probabilities;

    @com.fasterxml.jackson.annotation.JsonProperty("gradcam_image_base64")
    private String gradcamImageBase64;
}
