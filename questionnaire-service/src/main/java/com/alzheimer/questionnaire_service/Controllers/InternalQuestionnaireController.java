package com.alzheimer.questionnaire_service.Controllers;

import com.alzheimer.questionnaire_service.Entities.QuestionAnswer;
import com.alzheimer.questionnaire_service.Entities.QuestionnaireResponse;
import com.alzheimer.questionnaire_service.Repositories.QuestionnaireResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/questionnaire")
@RequiredArgsConstructor
public class InternalQuestionnaireController {

    private final QuestionnaireResponseRepository repository;

    @GetMapping("/latest/{email}")
    public Map<String, Object> latest(@PathVariable("email") String email) {
        List<QuestionnaireResponse> responses = repository.findByPatientEmailOrderByCreatedAtDesc(email);
        if (responses.isEmpty()) {
            return Map.of("patientEmail", email, "answers", List.of());
        }
        QuestionnaireResponse latest = responses.get(0);
        List<String> answers = latest.getAnswers() == null ? List.of()
                : latest.getAnswers().stream()
                    .map(this::formatAnswer)
                    .toList();
        return Map.of(
                "patientEmail", email,
                "answers", answers,
                "score", latest.getScore(),
                "riskBucket", latest.getRiskBucket() == null ? "" : latest.getRiskBucket());
    }

    private String formatAnswer(QuestionAnswer a) {
        return a.getQuestionId() + ": " + a.getValue();
    }
}
