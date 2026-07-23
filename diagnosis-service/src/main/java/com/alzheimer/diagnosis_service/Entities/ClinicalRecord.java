package com.alzheimer.diagnosis_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "clinical_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalRecord {

    @Id
    private String id;

    @Indexed(unique = true)
    private String patientEmail;

    private String symptoms;
    private String medicalHistory;
    private String treatments;
    private String observations;
    private String cognitiveScores;

    private String createdByEmail;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
