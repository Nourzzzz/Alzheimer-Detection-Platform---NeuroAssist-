package com.alzheimer.diagnosis_service.Config;

import com.alzheimer.diagnosis_service.Exception.ClinicalDataRequiredException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ClinicalDataRequiredException.class)
    public ResponseEntity<Map<String, Object>> handleClinicalDataRequired(ClinicalDataRequiredException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "code", "CLINICAL_DATA_REQUIRED",
                        "message", ex.getMessage(),
                        "missingClinicalRecord", ex.isMissingClinicalRecord(),
                        "missingCognitiveQuestionnaire", ex.isMissingCognitiveQuestionnaire()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage()));
    }
}
