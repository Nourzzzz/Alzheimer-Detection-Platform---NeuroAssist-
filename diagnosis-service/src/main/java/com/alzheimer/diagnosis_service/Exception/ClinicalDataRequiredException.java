package com.alzheimer.diagnosis_service.Exception;

public class ClinicalDataRequiredException extends RuntimeException {

    private final boolean missingClinicalRecord;
    private final boolean missingCognitiveQuestionnaire;

    public ClinicalDataRequiredException(boolean missingClinicalRecord, boolean missingCognitiveQuestionnaire) {
        super("Clinical data is required before running the AI analysis.");
        this.missingClinicalRecord = missingClinicalRecord;
        this.missingCognitiveQuestionnaire = missingCognitiveQuestionnaire;
    }

    public boolean isMissingClinicalRecord() {
        return missingClinicalRecord;
    }

    public boolean isMissingCognitiveQuestionnaire() {
        return missingCognitiveQuestionnaire;
    }
}
