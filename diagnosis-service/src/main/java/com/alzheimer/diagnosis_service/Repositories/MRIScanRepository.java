package com.alzheimer.diagnosis_service.Repositories;

import com.alzheimer.diagnosis_service.Entities.MRIScan;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MRIScanRepository extends MongoRepository<MRIScan, String> {
    List<MRIScan> findByPatientEmailOrderByUploadedAtDesc(String patientEmail);
}
