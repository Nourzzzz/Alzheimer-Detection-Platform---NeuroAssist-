package com.alzheimer.diagnosis_service.Client;

import com.alzheimer.diagnosis_service.Dto.CognitiveSummaryDto;
import com.alzheimer.diagnosis_service.Dto.QuestionnaireSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "questionnaire-service")
public interface QuestionnaireServiceClient {

    @GetMapping("/internal/questionnaire/latest/{email}")
    QuestionnaireSummaryDto getLatestAnswers(@PathVariable("email") String email);

    @GetMapping("/internal/cognitive/latest/{email}")
    CognitiveSummaryDto getLatestCognitive(@PathVariable("email") String email);
}
