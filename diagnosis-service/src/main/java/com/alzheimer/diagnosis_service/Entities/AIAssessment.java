package com.alzheimer.diagnosis_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
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

    private String doctorComment;

    @Builder.Default
    private ValidationStatus validationStatus = ValidationStatus.NOT_READY;
    private String validatedByEmail;
    private LocalDateTime validatedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

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
    public static class RagContextRef {
        private String source;
        private String docId;
        private String snippet;
        private double score;
    }
}
