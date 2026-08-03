package com.alzheimer.diagnosis_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "ai_assessments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIAssessment {

    @Id
    private String id;

    private String mriScanId;
    private String patientEmail;
    private String doctorEmail;
    private String clinicalNoteId;

    private CnnResult cnnResult;
    private double riskScore;
    private String stage;
    private String gradCamImagePath;

    private ClinicalBertExtraction clinicalBertExtraction;
    private List<RagContextRef> ragContextRefs;

    private String generatedReport;
    private String editedReport;
    private String correctedStage;

    /** Generated guidance, keyed by language, so the patient can switch later. */
    @Builder.Default
    private Map<String, String> patientGuidanceByLang = new HashMap<>();

    /** Doctor-reviewed guidance, keyed by the language it was written in. */
    @Builder.Default
    private Map<String, String> editedGuidanceByLang = new HashMap<>();

    /** Single-language guidance of assessments created before the bilingual split. */
    private String patientGuidance;
    private String editedGuidance;

    @Builder.Default
    private List<Revision> revisions = new ArrayList<>();

    private String doctorComment;

    @Builder.Default
    private ValidationStatus validationStatus = ValidationStatus.NOT_READY;
    private String validatedByEmail;
    private LocalDateTime validatedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Guidance to show for {@code lang}, and the language actually served.
     *
     * <p>A text the doctor reviewed always wins over a generated one, even when
     * it was written in the other language: showing an unreviewed variant of
     * clinical advice the doctor deliberately corrected would be worse than
     * showing it in the wrong language. Callers get the served language back so
     * they can say so.
     */
    public ResolvedGuidance resolveGuidance(String lang) {
        ResolvedGuidance edited = pick(editedGuidanceByLang, lang);
        if (edited != null) {
            return edited;
        }
        if (editedGuidance != null && !editedGuidance.isBlank()) {
            return new ResolvedGuidance(editedGuidance, lang);
        }
        ResolvedGuidance generated = pick(patientGuidanceByLang, lang);
        if (generated != null) {
            return generated;
        }
        return patientGuidance == null || patientGuidance.isBlank()
                ? null
                : new ResolvedGuidance(patientGuidance, lang);
    }

    private static ResolvedGuidance pick(Map<String, String> byLang, String lang) {
        if (byLang == null || byLang.isEmpty()) {
            return null;
        }
        String exact = byLang.get(lang);
        if (exact != null && !exact.isBlank()) {
            return new ResolvedGuidance(exact, lang);
        }
        return byLang.entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isBlank())
                .findFirst()
                .map(e -> new ResolvedGuidance(e.getValue(), e.getKey()))
                .orElse(null);
    }

    public record ResolvedGuidance(String text, String lang) {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CnnResult {
        private String predictedClass;
        private double confidence;
        private Map<String, Double> probabilities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClinicalBertExtraction {
        private List<String> symptoms;
        private List<String> treatments;
        private List<String> conditions;
        private List<String> history;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Revision {
        private int round;
        private String rejectedReport;
        private String doctorFeedback;
        private String requestedByEmail;
        private LocalDateTime requestedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RagContextRef {
        private String source;
        private String docId;
        private String snippet;
        private double score;
    }
}
