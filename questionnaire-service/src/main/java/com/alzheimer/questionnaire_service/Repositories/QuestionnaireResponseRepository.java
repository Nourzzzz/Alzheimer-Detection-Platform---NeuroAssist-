package com.alzheimer.questionnaire_service.Repositories;

import com.alzheimer.questionnaire_service.Entities.QuestionnaireResponse;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface QuestionnaireResponseRepository extends MongoRepository<QuestionnaireResponse, String> {
    List<QuestionnaireResponse> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);
    List<QuestionnaireResponse> findTop10ByOrderByCreatedAtDesc();
}
