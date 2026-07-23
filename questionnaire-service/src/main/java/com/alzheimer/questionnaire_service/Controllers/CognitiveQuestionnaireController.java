package com.alzheimer.questionnaire_service.Controllers;

import com.alzheimer.questionnaire_service.Dto.CognitiveAnswerRequest;
import com.alzheimer.questionnaire_service.Dto.CognitiveTurnResponse;
import com.alzheimer.questionnaire_service.Service.CognitiveQuestionnaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/patient/cognitive")
@RequiredArgsConstructor
public class CognitiveQuestionnaireController {

    private final CognitiveQuestionnaireService cognitiveQuestionnaireService;

    @PostMapping("/start")
    public ResponseEntity<CognitiveTurnResponse> start() {
        return ResponseEntity.ok(cognitiveQuestionnaireService.start());
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<CognitiveTurnResponse> answer(@PathVariable String sessionId,
                                                        @Valid @RequestBody CognitiveAnswerRequest request) {
        return ResponseEntity.ok(cognitiveQuestionnaireService.answer(sessionId, request.getAnswer()));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<CognitiveTurnResponse> get(@PathVariable String sessionId) {
        return ResponseEntity.ok(cognitiveQuestionnaireService.getSession(sessionId));
    }

    @GetMapping("/{sessionId}/summary")
    public ResponseEntity<Map<String, Object>> summary(@PathVariable String sessionId) {
        return ResponseEntity.ok(cognitiveQuestionnaireService.getSummary(sessionId));
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latestForMe() {
        return ResponseEntity.ok(cognitiveQuestionnaireService.getMyLatestFinishedSummary());
    }
}
