package com.alzheimer.diagnosis_service.Controllers;

import com.alzheimer.diagnosis_service.Dto.AiAssessmentResponseDto;
import com.alzheimer.diagnosis_service.Service.MriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/medecin/mri")
@RequiredArgsConstructor
public class MriController {

    private final MriService mriService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<AiAssessmentResponseDto> upload(
            @RequestParam("patientEmail") String patientEmail,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clinicalNote", required = false, defaultValue = "") String clinicalNote,
            @RequestHeader(value = "Accept-Language", required = false) String lang) {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(mriService.toDto(mriService.uploadAndAnalyze(patientEmail, doctorEmail, file, clinicalNote, normalizeLang(lang))));
    }

    @GetMapping("/{patientEmail}")
    public ResponseEntity<List<AiAssessmentResponseDto>> history(@PathVariable String patientEmail) {
        return ResponseEntity.ok(mriService.history(patientEmail));
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
