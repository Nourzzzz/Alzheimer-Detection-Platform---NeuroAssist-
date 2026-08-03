package com.alzheimer.questionnaire_service.Service;

import com.alzheimer.questionnaire_service.Dto.AiCognitiveNextRequest;
import com.alzheimer.questionnaire_service.Dto.AiCognitiveNextResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiQuestionnaireClient {

    private final RestTemplate restTemplate;

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    public AiCognitiveNextResponse next(Map<String, Object> state, String answer, String lang) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AiCognitiveNextRequest> entity =
                new HttpEntity<>(new AiCognitiveNextRequest(state, answer, lang), headers);
        return restTemplate.postForObject(aiServiceUrl + "/questionnaire/next", entity, AiCognitiveNextResponse.class);
    }

}
