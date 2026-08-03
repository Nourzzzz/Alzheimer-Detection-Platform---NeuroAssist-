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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/patient/cognitive")
@RequiredArgsConstructor
public class CognitiveQuestionnaireController {

    private final CognitiveQuestionnaireService cognitiveQuestionnaireService;

    @PostMapping("/start")
    public ResponseEntity<CognitiveTurnResponse> start(
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        return ResponseEntity.ok(cognitiveQuestionnaireService.start(normalizeLang(lang)));
    }

    @PostMapping("/{sessionId}/answer")
    public ResponseEntity<CognitiveTurnResponse> answer(
            @PathVariable String sessionId,
            @Valid @RequestBody CognitiveAnswerRequest request,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        return ResponseEntity.ok(
                cognitiveQuestionnaireService.answer(sessionId, request.getAnswer(), normalizeLang(lang)));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<CognitiveTurnResponse> get(@PathVariable String sessionId) {
        return ResponseEntity.ok(cognitiveQuestionnaireService.getSession(sessionId));
    }

    /** Completion flag only — the scored summary is reserved for the reviewing doctor. */
    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latestForMe() {
        return ResponseEntity.ok(cognitiveQuestionnaireService.getMyQuestionnaireStatus());
    }

    /** Keeps only a supported language tag; anything else falls back to French. */
    private String normalizeLang(String header) {
        if (header == null || header.isBlank()) {
            return "fr";
        }
        String tag = header.split(",")[0].trim().toLowerCase().split("-")[0];
        return "en".equals(tag) ? "en" : "fr";
    }
}
