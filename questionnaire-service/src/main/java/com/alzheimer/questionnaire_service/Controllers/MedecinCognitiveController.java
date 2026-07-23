package com.alzheimer.questionnaire_service.Controllers;

import com.alzheimer.questionnaire_service.Service.CognitiveQuestionnaireService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/medecin/cognitive")
@RequiredArgsConstructor
public class MedecinCognitiveController {

    private final CognitiveQuestionnaireService cognitiveQuestionnaireService;

    @GetMapping("/latest/{email}")
    public Map<String, Object> latest(@PathVariable("email") String email) {
        Map<String, Object> summary = cognitiveQuestionnaireService.getLatestFinishedSummary(email);
        if (summary == null) {
            return Map.of("exists", false);
        }
        Map<String, Object> result = new HashMap<>(summary);
        result.put("exists", true);
        return result;
    }
}
