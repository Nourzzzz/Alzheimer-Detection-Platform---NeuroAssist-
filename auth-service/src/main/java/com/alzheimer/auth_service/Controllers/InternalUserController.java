package com.alzheimer.auth_service.Controllers;

import com.alzheimer.auth_service.Dto.UserSummaryDto;
import com.alzheimer.auth_service.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/users")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;

    @GetMapping("/{email}")
    public ResponseEntity<UserSummaryDto> getByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email)
                .map(user -> UserSummaryDto.builder()
                        .email(user.getEmail())
                        .prenom(user.getPrenom())
                        .nom(user.getNom())
                        .referringDoctorEmail(user.getReferringDoctorEmail())
                        .build())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
