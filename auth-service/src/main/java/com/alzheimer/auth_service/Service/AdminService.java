package com.alzheimer.auth_service.Service;

import com.alzheimer.auth_service.Dto.CreateDoctorRequest;
import com.alzheimer.auth_service.Dto.DoctorAdminDto;
import com.alzheimer.auth_service.Dto.PatientAdminDto;
import com.alzheimer.auth_service.Dto.UpdateDoctorRequest;
import com.alzheimer.auth_service.Entities.AccountStatus;
import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<DoctorAdminDto> listDoctors(String search, AccountStatus status) {
        return userRepository.findByRole("MEDECIN").stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> status == null || user.getStatus() == status)
                .map(this::toDoctorDto)
                .toList();
    }

    public DoctorAdminDto createDoctor(CreateDoctorRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User doctor = User.builder()
                .prenom(request.getPrenom())
                .nom(request.getNom())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .specialite(request.getSpecialite())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("MEDECIN")
                .status(AccountStatus.ACTIVE)
                .build();

        userRepository.save(doctor);
        return toDoctorDto(doctor);
    }

    public DoctorAdminDto updateDoctor(String id, UpdateDoctorRequest request) {
        User doctor = getDoctorOrThrow(id);

        doctor.setPrenom(request.getPrenom());
        doctor.setNom(request.getNom());
        doctor.setTelephone(request.getTelephone());
        doctor.setSpecialite(request.getSpecialite());
        doctor.setNumeroOrdre(request.getNumeroOrdre());
        doctor.setEtablissement(request.getEtablissement());
        doctor.setUpdatedAt(LocalDateTime.now());

        userRepository.save(doctor);
        return toDoctorDto(doctor);
    }

    public DoctorAdminDto setDoctorStatus(String id, AccountStatus status) {
        User doctor = getDoctorOrThrow(id);
        doctor.setStatus(status);
        doctor.setUpdatedAt(LocalDateTime.now());
        userRepository.save(doctor);
        return toDoctorDto(doctor);
    }

    public List<PatientAdminDto> listPatients(String search, AccountStatus status) {
        return userRepository.findByRole("PATIENT").stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> status == null || user.getStatus() == status)
                .map(this::toPatientDto)
                .toList();
    }

    public PatientAdminDto getPatient(String id) {
        return toPatientDto(getPatientOrThrow(id));
    }

    public PatientAdminDto setPatientStatus(String id, AccountStatus status) {
        User patient = getPatientOrThrow(id);
        patient.setStatus(status);
        patient.setUpdatedAt(LocalDateTime.now());
        userRepository.save(patient);
        return toPatientDto(patient);
    }

    public PatientAdminDto setPatientReferringDoctor(String id, String referringDoctorEmail) {
        User patient = getPatientOrThrow(id);
        User doctor = userRepository.findByEmail(referringDoctorEmail)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!"MEDECIN".equals(doctor.getRole()) || doctor.getStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("This doctor is not available as a referring doctor");
        }

        patient.setReferringDoctorEmail(referringDoctorEmail);
        patient.setUpdatedAt(LocalDateTime.now());
        userRepository.save(patient);
        return toPatientDto(patient);
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

    private User getDoctorOrThrow(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (!"MEDECIN".equals(user.getRole())) {
            throw new RuntimeException("Doctor not found");
        }
        return user;
    }

    private User getPatientOrThrow(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        if (!"PATIENT".equals(user.getRole())) {
            throw new RuntimeException("Patient not found");
        }
        return user;
    }

    private DoctorAdminDto toDoctorDto(User user) {
        return DoctorAdminDto.builder()
                .id(user.getId())
                .prenom(user.getPrenom())
                .nom(user.getNom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .specialite(user.getSpecialite())
                .numeroOrdre(user.getNumeroOrdre())
                .etablissement(user.getEtablissement())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private PatientAdminDto toPatientDto(User user) {
        return PatientAdminDto.builder()
                .id(user.getId())
                .prenom(user.getPrenom())
                .nom(user.getNom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .groupeSanguin(user.getGroupeSanguin())
                .antecedentsMedicaux(user.getAntecedentsMedicaux())
                .referringDoctorEmail(user.getReferringDoctorEmail())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
