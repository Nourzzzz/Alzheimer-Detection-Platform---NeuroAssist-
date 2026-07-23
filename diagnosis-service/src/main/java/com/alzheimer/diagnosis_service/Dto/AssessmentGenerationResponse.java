package com.alzheimer.diagnosis_service.Dto;

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
public class AssessmentGenerationResponse {

    @JsonProperty("clinical_bert")
    private ClinicalBert clinicalBert;

    @JsonProperty("rag_context")
    private List<RagContext> ragContext;

    private String report;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClinicalBert {
        private List<String> symptoms;
        private List<String> treatments;
        private List<String> conditions;
        private List<String> history;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RagContext {
        private String source;
        @JsonProperty("doc_id")
        private String docId;
        private String title;
        private String snippet;
        private double score;
    }
}
