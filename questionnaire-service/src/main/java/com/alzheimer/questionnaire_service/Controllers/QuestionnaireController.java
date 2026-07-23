package com.alzheimer.questionnaire_service.Controllers;

import com.alzheimer.questionnaire_service.Dto.QuestionDto;
import com.alzheimer.questionnaire_service.Dto.QuestionnaireResultResponse;
import com.alzheimer.questionnaire_service.Dto.QuestionnaireSubmitRequest;
import com.alzheimer.questionnaire_service.Service.QuestionnaireService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient/questionnaire")
@RequiredArgsConstructor
public class QuestionnaireController {

    private final QuestionnaireService questionnaireService;

    @GetMapping("")
    public ResponseEntity<List<QuestionDto>> getQuestions() {
        return ResponseEntity.ok(questionnaireService.getQuestions());
    }

    @PostMapping("/submit")
    public ResponseEntity<QuestionnaireResultResponse> submit(@Valid @RequestBody QuestionnaireSubmitRequest request) {
        return ResponseEntity.ok(questionnaireService.submit(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<QuestionnaireResultResponse>> getHistory() {
        return ResponseEntity.ok(questionnaireService.getHistory());
    }
}
