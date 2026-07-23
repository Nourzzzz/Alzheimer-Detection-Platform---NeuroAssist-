package com.alzheimer.auth_service.Service;

import com.alzheimer.auth_service.Dto.AuthResponse;
import com.alzheimer.auth_service.Dto.DoctorOptionDto;
import com.alzheimer.auth_service.Dto.LoginRequest;
import com.alzheimer.auth_service.Dto.RegisterRequest;
import com.alzheimer.auth_service.Entities.AccountStatus;
import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Repositories.UserRepository;
import com.alzheimer.auth_service.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        if (!"PATIENT".equals(request.getRole())) {
            throw new RuntimeException("Doctor accounts cannot be created through this route");
        }

        User user = User.builder()
                .prenom(request.getPrenom())
                .nom(request.getNom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .telephone(request.getTelephone())
                .genre(request.getGenre())
                .dateNaissance(request.getDateNaissance() == null ? null : request.getDateNaissance().atStartOfDay())
                .specialite(request.getSpecialite())
                .numeroOrdre(request.getNumeroOrdre())
                .etablissement(request.getEtablissement())
                .groupeSanguin(request.getGroupeSanguin())
                .antecedentsMedicaux(request.getAntecedentsMedicaux())
                .referringDoctorEmail(resolveReferringDoctorEmail(request.getReferringDoctorEmail()))
                .status(AccountStatus.ACTIVE)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole())
                .prenom(user.getPrenom())
                .nom(user.getNom())
                .email(user.getEmail())
                .build();
    }

    public List<DoctorOptionDto> listActiveDoctors() {
        return userRepository.findByRole("MEDECIN").stream()
                .filter(doctor -> doctor.getStatus() == AccountStatus.ACTIVE)
                .map(doctor -> DoctorOptionDto.builder()
                        .email(doctor.getEmail())
                        .prenom(doctor.getPrenom())
                        .nom(doctor.getNom())
                        .specialite(doctor.getSpecialite())
                        .build())
                .toList();
    }

    private String resolveReferringDoctorEmail(String referringDoctorEmail) {
        if (referringDoctorEmail == null || referringDoctorEmail.isBlank()) {
            return null;
        }

        User doctor = userRepository.findByEmail(referringDoctorEmail)
                .orElseThrow(() -> new RuntimeException("Referring doctor not found"));

        if (!"MEDECIN".equals(doctor.getRole()) || doctor.getStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("Referring doctor not found");
        }

        return referringDoctorEmail;
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Incorrect email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Incorrect email or password");
        }

        if (user.getStatus() == AccountStatus.INACTIVE) {
            throw new RuntimeException("Account deactivated");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .role(user.getRole())
                .prenom(user.getPrenom())
                .nom(user.getNom())
                .email(user.getEmail())
                .build();
    }
}
