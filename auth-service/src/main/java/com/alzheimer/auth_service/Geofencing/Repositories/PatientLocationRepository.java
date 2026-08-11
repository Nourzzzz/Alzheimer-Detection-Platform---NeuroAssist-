package com.alzheimer.auth_service.Geofencing.Repositories;

import com.alzheimer.auth_service.Geofencing.Entities.PatientLocation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PatientLocationRepository extends MongoRepository<PatientLocation, String> {
    Optional<PatientLocation> findFirstByPatientIdOrderByTimestampDesc(String patientId);
    List<PatientLocation> findByPatientIdOrderByTimestampDesc(String patientId);
}
