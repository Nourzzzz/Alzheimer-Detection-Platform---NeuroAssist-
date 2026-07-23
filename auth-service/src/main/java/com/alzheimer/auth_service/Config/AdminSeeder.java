package com.alzheimer.auth_service.Config;

import com.alzheimer.auth_service.Entities.AccountStatus;
import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.default-email}")
    private String defaultEmail;

    @Value("${admin.default-password}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        if (userRepository.existsByRole("ADMIN")) {
            return;
        }

        User admin = User.builder()
                .prenom("Admin")
                .nom("Système")
                .email(defaultEmail)
                .password(passwordEncoder.encode(defaultPassword))
                .role("ADMIN")
                .status(AccountStatus.ACTIVE)
                .build();

        userRepository.save(admin);
        log.info("Compte administrateur par défaut créé : {}", defaultEmail);
    }
}
