package com.alzheimer.diagnosis_service.Controllers;

import com.alzheimer.diagnosis_service.Dto.PatientAssessmentView;
import com.alzheimer.diagnosis_service.Service.MriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/patient/mri")
@RequiredArgsConstructor
public class PatientMriController {

    private final MriService mriService;

    @GetMapping("/results")
    public ResponseEntity<List<PatientAssessmentView>> results(
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        String patientEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(mriService.patientResults(patientEmail, normalizeLang(lang)));
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
