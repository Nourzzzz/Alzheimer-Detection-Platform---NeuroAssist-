package com.alzheimer.questionnaire_service.Service;

import com.alzheimer.questionnaire_service.Dto.AiCognitiveNextResponse;
import com.alzheimer.questionnaire_service.Dto.CognitiveTurnResponse;
import com.alzheimer.questionnaire_service.Entities.CognitiveSession;
import com.alzheimer.questionnaire_service.Repositories.CognitiveSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CognitiveQuestionnaireService {

    private final CognitiveSessionRepository repository;
    private final AiQuestionnaireClient aiQuestionnaireClient;

    public CognitiveTurnResponse start(String lang) {
        String email = getCurrentPatientEmail();
        AiCognitiveNextResponse resp = aiQuestionnaireClient.next(null, null, lang);

        CognitiveSession session = CognitiveSession.builder()
                .patientEmail(email)
                .state(resp.getState())
                .lastQuestion(resp.getQuestion())
                .finished(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        repository.save(session);

        return toTurnResponse(session.getId(), resp);
    }

    public CognitiveTurnResponse answer(String sessionId, String answer, String lang) {
        String email = getCurrentPatientEmail();
        CognitiveSession session = getOwnedSession(sessionId, email);
        if (session.isFinished()) {
            throw new RuntimeException("Ce questionnaire est déjà terminé.");
        }

        AiCognitiveNextResponse resp = aiQuestionnaireClient.next(session.getState(), answer, lang);

        session.setState(resp.getState());
        session.setLastQuestion(resp.getQuestion());
        session.setUpdatedAt(LocalDateTime.now());
        if (resp.isFinished()) {
            session.setFinished(true);
            session.setSummary(resp.getSummary());
        }
        repository.save(session);

        return toTurnResponse(session.getId(), resp);
    }

    public CognitiveTurnResponse getSession(String sessionId) {
        String email = getCurrentPatientEmail();
        CognitiveSession session = getOwnedSession(sessionId, email);
        return CognitiveTurnResponse.builder()
                .sessionId(session.getId())
                .finished(session.isFinished())
                .question(session.isFinished() ? null : session.getLastQuestion())
                .build();
    }

    public Map<String, Object> getLatestFinishedSummary(String patientEmail) {
        return repository.findFirstByPatientEmailAndFinishedTrueOrderByCreatedAtDesc(patientEmail)
                .map(CognitiveSession::getSummary)
                .orElse(null);
    }

    /**
     * Patient-facing: only says whether a run was completed. Scores, red flags and
     * narrative stay server-side until a doctor has reviewed the case.
     */
    public Map<String, Object> getMyQuestionnaireStatus() {
        return repository.findFirstByPatientEmailAndFinishedTrueOrderByCreatedAtDesc(getCurrentPatientEmail())
                .<Map<String, Object>>map(s -> Map.of("exists", true, "completedAt", s.getUpdatedAt().toString()))
                .orElse(Map.of("exists", false));
    }

    private CognitiveSession getOwnedSession(String sessionId, String email) {
        CognitiveSession session = repository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session introuvable."));
        if (!session.getPatientEmail().equals(email)) {
            throw new RuntimeException("Cette session n'appartient pas à ce patient.");
        }
        return session;
    }

    private CognitiveTurnResponse toTurnResponse(String sessionId, AiCognitiveNextResponse resp) {
        return CognitiveTurnResponse.builder()
                .sessionId(sessionId)
                .finished(resp.isFinished())
                .question(resp.getQuestion())
                .build();
    }

    private String getCurrentPatientEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
