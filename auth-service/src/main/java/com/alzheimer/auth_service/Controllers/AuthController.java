package com.alzheimer.auth_service.Controllers;

import com.alzheimer.auth_service.Dto.AuthResponse;
import com.alzheimer.auth_service.Dto.DoctorOptionDto;
import com.alzheimer.auth_service.Dto.LoginRequest;
import com.alzheimer.auth_service.Dto.RegisterRequest;
import com.alzheimer.auth_service.Service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorOptionDto>> listActiveDoctors() {
        return ResponseEntity.ok(authService.listActiveDoctors());
    }
}
