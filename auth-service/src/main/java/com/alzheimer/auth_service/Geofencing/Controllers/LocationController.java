package com.alzheimer.auth_service.Geofencing.Controllers;

import com.alzheimer.auth_service.Geofencing.Dto.LocationRequest;
import com.alzheimer.auth_service.Geofencing.Dto.LocationResponse;
import com.alzheimer.auth_service.Geofencing.Entities.Alert;
import com.alzheimer.auth_service.Geofencing.Entities.PatientLocation;
import com.alzheimer.auth_service.Geofencing.GeofencingService;
import com.alzheimer.auth_service.Repositories.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationController {

    private final GeofencingService geofencingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<LocationResponse> report(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(geofencingService.recordLocation(resolvePatientId(request), request));
    }

    @GetMapping("/latest/{patientId}")
    public ResponseEntity<PatientLocation> latest(@PathVariable String patientId) {
        return geofencingService.latestLocation(patientId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/history/{patientId}")
    public ResponseEntity<List<PatientLocation>> history(@PathVariable String patientId) {
        return ResponseEntity.ok(geofencingService.locationHistory(patientId));
    }

    @GetMapping("/alerts/{patientId}")
    public ResponseEntity<List<Alert>> alerts(@PathVariable String patientId) {
        return ResponseEntity.ok(geofencingService.alertsOf(patientId));
    }

    /**
     * Decides whose position is being reported.
     *
     * <p>A patient may only report their own, whatever the body says — otherwise
     * any signed-in patient could fabricate positions for someone else. A doctor
     * may name the patient explicitly, which is what the demo mode relies on.
     */
    private String resolvePatientId(LocationRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isDoctor = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_MEDECIN") || a.equals("ROLE_ADMIN"));

        if (isDoctor) {
            if (request.getPatientId() == null || request.getPatientId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "patientId is required when reporting on a patient's behalf");
            }
            geofencingService.requirePatient(request.getPatientId());
            return request.getPatientId();
        }

        return userRepository.findByEmail(auth.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Unknown account"));
    }
}
