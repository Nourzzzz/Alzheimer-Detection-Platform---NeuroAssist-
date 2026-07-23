package com.alzheimer.diagnosis_service.Repositories;

import com.alzheimer.diagnosis_service.Entities.AIAssessment;
import com.alzheimer.diagnosis_service.Entities.ValidationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AIAssessmentRepository extends MongoRepository<AIAssessment, String> {
    List<AIAssessment> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);
    Optional<AIAssessment> findByMriScanId(String mriScanId);

    List<AIAssessment> findByDoctorEmailAndValidationStatusOrderByCreatedAtDesc(
            String doctorEmail, ValidationStatus validationStatus);

    long countByDoctorEmailAndValidationStatus(String doctorEmail, ValidationStatus validationStatus);

    List<AIAssessment> findByPatientEmailAndValidationStatusInOrderByCreatedAtDesc(
            String patientEmail, Collection<ValidationStatus> statuses);
}
