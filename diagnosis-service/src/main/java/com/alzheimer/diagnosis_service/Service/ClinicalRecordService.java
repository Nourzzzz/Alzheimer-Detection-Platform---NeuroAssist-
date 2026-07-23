package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Dto.ClinicalRecordDto;
import com.alzheimer.diagnosis_service.Dto.ClinicalRecordRequest;
import com.alzheimer.diagnosis_service.Entities.ClinicalRecord;
import com.alzheimer.diagnosis_service.Repositories.ClinicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ClinicalRecordService {

    private final ClinicalRecordRepository repository;

    public boolean exists(String patientEmail) {
        return repository.existsByPatientEmail(patientEmail);
    }

    public ClinicalRecordDto get(String patientEmail) {
        return repository.findByPatientEmail(patientEmail)
                .map(this::toDto)
                .orElse(null);
    }

    public ClinicalRecordDto save(String patientEmail, ClinicalRecordRequest request, String doctorEmail) {
        ClinicalRecord record = repository.findByPatientEmail(patientEmail)
                .orElseGet(() -> ClinicalRecord.builder()
                        .patientEmail(patientEmail)
                        .createdByEmail(doctorEmail)
                        .createdAt(LocalDateTime.now())
                        .build());

        record.setSymptoms(request.getSymptoms());
        record.setMedicalHistory(request.getMedicalHistory());
        record.setTreatments(request.getTreatments());
        record.setObservations(request.getObservations());
        record.setCognitiveScores(request.getCognitiveScores());
        record.setUpdatedAt(LocalDateTime.now());

        return toDto(repository.save(record));
    }

    public String buildClinicalNote(String patientEmail) {
        return repository.findByPatientEmail(patientEmail)
                .map(r -> java.util.stream.Stream.of(
                                section("Symptoms", r.getSymptoms()),
                                section("Medical history", r.getMedicalHistory()),
                                section("Treatments", r.getTreatments()),
                                section("Observations", r.getObservations()))
                        .filter(s -> !s.isBlank())
                        .collect(java.util.stream.Collectors.joining(". ")))
                .orElse("");
    }

    private String section(String label, String value) {
        return (value == null || value.isBlank()) ? "" : label + ": " + value.trim();
    }

    private ClinicalRecordDto toDto(ClinicalRecord r) {
        return ClinicalRecordDto.builder()
                .id(r.getId())
                .patientEmail(r.getPatientEmail())
                .symptoms(r.getSymptoms())
                .medicalHistory(r.getMedicalHistory())
                .treatments(r.getTreatments())
                .observations(r.getObservations())
                .cognitiveScores(r.getCognitiveScores())
                .createdByEmail(r.getCreatedByEmail())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
