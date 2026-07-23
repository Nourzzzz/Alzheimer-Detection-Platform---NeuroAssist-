package com.alzheimer.questionnaire_service.Service;

import com.alzheimer.questionnaire_service.Dto.AnswerDto;
import com.alzheimer.questionnaire_service.Dto.QuestionDto;
import com.alzheimer.questionnaire_service.Dto.QuestionOptionDto;
import com.alzheimer.questionnaire_service.Dto.QuestionnaireResultResponse;
import com.alzheimer.questionnaire_service.Dto.QuestionnaireSubmitRequest;
import com.alzheimer.questionnaire_service.Entities.QuestionAnswer;
import com.alzheimer.questionnaire_service.Entities.QuestionnaireResponse;
import com.alzheimer.questionnaire_service.Repositories.QuestionnaireResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionnaireService {

    private final QuestionnaireResponseRepository questionnaireResponseRepository;

    private static final List<QuestionOptionDto> STANDARD_OPTIONS = List.of(
            QuestionOptionDto.builder().value(0).label("Never").build(),
            QuestionOptionDto.builder().value(1).label("Rarely").build(),
            QuestionOptionDto.builder().value(2).label("Sometimes").build(),
            QuestionOptionDto.builder().value(3).label("Often").build()
    );

    private static final List<QuestionDto> QUESTIONS = List.of(
            QuestionDto.builder().id("q1").text("How often do you have trouble remembering recent conversations?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q2").text("How often do you misplace everyday items like keys or glasses?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q3").text("How often do you forget appointments or important dates?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q4").text("How often do you have difficulty finding the right word when speaking?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q5").text("How often do you get confused about the day, date, or time?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q6").text("How often do you have trouble following a conversation or a TV show's plot?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q7").text("How often do you find it hard to manage finances or pay bills on time?").options(STANDARD_OPTIONS).build(),
            QuestionDto.builder().id("q8").text("How often do you get lost or disoriented in familiar places?").options(STANDARD_OPTIONS).build()
    );

    public List<QuestionDto> getQuestions() {
        return QUESTIONS;
    }

    public QuestionnaireResultResponse submit(QuestionnaireSubmitRequest request) {
        String email = getCurrentPatientEmail();

        int score = request.getAnswers().stream()
                .mapToInt(AnswerDto::getValue)
                .sum();
        int maxScore = QUESTIONS.size() * 3;
        String riskBucket = computeRiskBucket(score, maxScore);

        List<QuestionAnswer> answers = request.getAnswers().stream()
                .map(answer -> QuestionAnswer.builder()
                        .questionId(answer.getQuestionId())
                        .value(answer.getValue())
                        .build())
                .toList();

        QuestionnaireResponse response = QuestionnaireResponse.builder()
                .patientEmail(email)
                .answers(answers)
                .score(score)
                .maxScore(maxScore)
                .riskBucket(riskBucket)
                .createdAt(LocalDateTime.now())
                .build();

        questionnaireResponseRepository.save(response);

        return toResultResponse(response);
    }

    public List<QuestionnaireResultResponse> getHistory() {
        String email = getCurrentPatientEmail();

        return questionnaireResponseRepository.findByPatientEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toResultResponse)
                .toList();
    }

    private String computeRiskBucket(int score, int maxScore) {
        double ratio = (double) score / maxScore;
        if (ratio <= 0.34) {
            return "Low";
        } else if (ratio <= 0.67) {
            return "Moderate";
        } else {
            return "Further Evaluation Recommended";
        }
    }

    private String getCurrentPatientEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private QuestionnaireResultResponse toResultResponse(QuestionnaireResponse response) {
        return QuestionnaireResultResponse.builder()
                .id(response.getId())
                .score(response.getScore())
                .maxScore(response.getMaxScore())
                .riskBucket(response.getRiskBucket())
                .createdAt(response.getCreatedAt())
                .build();
    }
}
