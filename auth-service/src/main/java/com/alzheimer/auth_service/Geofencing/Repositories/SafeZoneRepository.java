package com.alzheimer.auth_service.Geofencing.Repositories;

import com.alzheimer.auth_service.Geofencing.Entities.SafeZone;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SafeZoneRepository extends MongoRepository<SafeZone, String> {
    Optional<SafeZone> findByPatientId(String patientId);
}
