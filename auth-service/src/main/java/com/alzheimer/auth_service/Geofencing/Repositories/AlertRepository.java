package com.alzheimer.auth_service.Geofencing.Repositories;

import com.alzheimer.auth_service.Geofencing.Entities.Alert;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AlertRepository extends MongoRepository<Alert, String> {
    List<Alert> findByPatientIdOrderByTimestampDesc(String patientId);
    Optional<Alert> findFirstByPatientIdOrderByTimestampDesc(String patientId);
}
