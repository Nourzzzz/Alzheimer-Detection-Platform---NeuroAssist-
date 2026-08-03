package com.alzheimer.auth_service.Service;

import com.alzheimer.auth_service.Dto.CreatePatientRequest;
import com.alzheimer.auth_service.Dto.PatientDetailDto;
import com.alzheimer.auth_service.Dto.PatientForDoctorDto;
import com.alzheimer.auth_service.Dto.UpdatePatientRequest;
import com.alzheimer.auth_service.Entities.AccountStatus;
import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<PatientForDoctorDto> listMyPatients(String search, boolean includeArchived) {
        String doctorEmail = currentDoctorEmail();

        return userRepository.findByRoleAndReferringDoctorEmail("PATIENT", doctorEmail).stream()
                .filter(user -> includeArchived || user.getStatus() != AccountStatus.ARCHIVED)
                .filter(user -> matchesSearch(user, search))
                .map(this::toDto)
                .toList();
    }

    public PatientDetailDto createPatient(CreatePatientRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        String doctorEmail = currentDoctorEmail();

        User patient = User.builder()
                .prenom(request.getPrenom())
                .nom(request.getNom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role("PATIENT")
                .telephone(request.getTelephone())
                .adresse(request.getAdresse())
                .genre(request.getGenre())
                .dateNaissance(request.getDateNaissance() == null ? null : request.getDateNaissance().atStartOfDay())
                .groupeSanguin(request.getGroupeSanguin())
                .antecedentsMedicaux(request.getAntecedentsMedicaux())
                .referringDoctorEmail(doctorEmail)
                .status(AccountStatus.ACTIVE)
                .build();

        userRepository.save(patient);
        return toDetailDto(patient);
    }

    public PatientDetailDto getMyPatient(String id) {
        return toDetailDto(getOwnedPatientOrThrow(id));
    }

    public PatientDetailDto updateMyPatient(String id, UpdatePatientRequest request) {
        User patient = getOwnedPatientOrThrow(id);

        patient.setPrenom(request.getPrenom());
        patient.setNom(request.getNom());
        patient.setTelephone(request.getTelephone());
        patient.setAdresse(request.getAdresse());
        patient.setGenre(request.getGenre());
        patient.setDateNaissance(request.getDateNaissance() == null ? null : request.getDateNaissance().atStartOfDay());
        patient.setGroupeSanguin(request.getGroupeSanguin());
        patient.setAntecedentsMedicaux(request.getAntecedentsMedicaux());
        patient.setUpdatedAt(LocalDateTime.now());

        userRepository.save(patient);
        return toDetailDto(patient);
    }

    public PatientDetailDto archivePatient(String id) {
        return setStatus(id, AccountStatus.ARCHIVED);
    }

    public PatientDetailDto unarchivePatient(String id) {
        return setStatus(id, AccountStatus.ACTIVE);
    }

    private PatientDetailDto setStatus(String id, AccountStatus status) {
        User patient = getOwnedPatientOrThrow(id);
        patient.setStatus(status);
        patient.setUpdatedAt(LocalDateTime.now());
        userRepository.save(patient);
        return toDetailDto(patient);
    }

    private String currentDoctorEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }
        String needle = search.toLowerCase();
        return (user.getPrenom() != null && user.getPrenom().toLowerCase().contains(needle))
                || (user.getNom() != null && user.getNom().toLowerCase().contains(needle))
                || (user.getEmail() != null && user.getEmail().toLowerCase().contains(needle));
    }

    private User getOwnedPatientOrThrow(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        if (!"PATIENT".equals(user.getRole()) || !currentDoctorEmail().equals(user.getReferringDoctorEmail())) {
            throw new RuntimeException("Patient not found");
        }

        return user;
    }

    private PatientForDoctorDto toDto(User user) {
        return PatientForDoctorDto.builder()
                .id(user.getId())
                .firstName(user.getPrenom())
                .lastName(user.getNom())
                .dateOfBirth(user.getDateNaissance())
                .gender(user.getGenre())
                .email(user.getEmail())
                .phone(user.getTelephone())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PatientDetailDto toDetailDto(User user) {
        return PatientDetailDto.builder()
                .id(user.getId())
                .prenom(user.getPrenom())
                .nom(user.getNom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .adresse(user.getAdresse())
                .genre(user.getGenre())
                .dateNaissance(user.getDateNaissance() == null ? null : user.getDateNaissance().toLocalDate())
                .groupeSanguin(user.getGroupeSanguin())
                .antecedentsMedicaux(user.getAntecedentsMedicaux())
                .referringDoctorEmail(user.getReferringDoctorEmail())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
