package com.alzheimer.diagnosis_service.Entities;

public enum ValidationStatus {
    NOT_READY,
    PENDING_VALIDATION,
    REVISION_REQUESTED,
    VALIDATED,
    CORRECTED,
    REJECTED
}
