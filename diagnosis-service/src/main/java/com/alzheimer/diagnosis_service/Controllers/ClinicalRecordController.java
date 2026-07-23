package com.alzheimer.diagnosis_service.Controllers;

import com.alzheimer.diagnosis_service.Dto.ClinicalRecordDto;
import com.alzheimer.diagnosis_service.Dto.ClinicalRecordRequest;
import com.alzheimer.diagnosis_service.Service.ClinicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/medecin/clinical-records")
@RequiredArgsConstructor
public class ClinicalRecordController {

    private final ClinicalRecordService clinicalRecordService;

    @GetMapping("/{email}")
    public ResponseEntity<ClinicalRecordDto> get(@PathVariable("email") String email) {
        ClinicalRecordDto dto = clinicalRecordService.get(email);
        return dto == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(dto);
    }

    @GetMapping("/{email}/exists")
    public ResponseEntity<Map<String, Boolean>> exists(@PathVariable("email") String email) {
        return ResponseEntity.ok(Map.of("exists", clinicalRecordService.exists(email)));
    }

    @PostMapping("/{email}")
    public ResponseEntity<ClinicalRecordDto> save(@PathVariable("email") String email,
                                                  @Valid @RequestBody ClinicalRecordRequest request) {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(clinicalRecordService.save(email, request, doctorEmail));
    }
}
