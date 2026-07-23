package com.alzheimer.questionnaire_service.Repositories;

import com.alzheimer.questionnaire_service.Entities.CognitiveSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CognitiveSessionRepository extends MongoRepository<CognitiveSession, String> {
    List<CognitiveSession> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    Optional<CognitiveSession> findFirstByPatientEmailAndFinishedTrueOrderByCreatedAtDesc(String patientEmail);
}
