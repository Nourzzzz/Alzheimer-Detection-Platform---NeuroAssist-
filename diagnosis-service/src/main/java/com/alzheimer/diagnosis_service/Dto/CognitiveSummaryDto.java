package com.alzheimer.diagnosis_service.Dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CognitiveSummaryDto {
    private boolean exists;
    private String narrative;
    private GlobalRisk globalRisk;
    private List<String> redFlags;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GlobalRisk {
        private String level;
        private String label;
    }
}
