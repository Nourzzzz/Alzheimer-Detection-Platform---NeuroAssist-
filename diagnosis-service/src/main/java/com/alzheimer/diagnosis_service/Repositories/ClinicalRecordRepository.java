package com.alzheimer.diagnosis_service.Repositories;

import com.alzheimer.diagnosis_service.Entities.ClinicalRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ClinicalRecordRepository extends MongoRepository<ClinicalRecord, String> {
    Optional<ClinicalRecord> findByPatientEmail(String patientEmail);
    boolean existsByPatientEmail(String patientEmail);
}
