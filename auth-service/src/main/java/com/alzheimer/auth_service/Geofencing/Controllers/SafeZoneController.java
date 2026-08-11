package com.alzheimer.auth_service.Geofencing.Controllers;

import com.alzheimer.auth_service.Geofencing.Dto.SafeZoneRequest;
import com.alzheimer.auth_service.Geofencing.Entities.SafeZone;
import com.alzheimer.auth_service.Geofencing.GeocodingService;
import com.alzheimer.auth_service.Geofencing.GeofencingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/safe-zone")
@RequiredArgsConstructor
public class SafeZoneController {

    private final GeofencingService geofencingService;
    private final GeocodingService geocodingService;

    @PostMapping
    public ResponseEntity<SafeZone> save(@Valid @RequestBody SafeZoneRequest request) {
        String definedBy = SecurityContextHolder.getContext().getAuthentication().getName();
        geofencingService.requirePatient(request.getPatientId());
        return ResponseEntity.ok(geofencingService.saveSafeZone(request, definedBy));
    }

    @GetMapping("/{patientId}")
    public ResponseEntity<SafeZone> get(@PathVariable String patientId) {
        return geofencingService.safeZoneOf(patientId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * The patient's own zone, resolved from the token.
     *
     * <p>Lets the patient space centre its map and start the demo simulation
     * without ever exposing the internal patient id to the browser.
     */
    @GetMapping("/me")
    public ResponseEntity<SafeZone> mine() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return geofencingService.safeZoneOfEmail(email)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Address lookup for the map, proxied so Nominatim sees one identified caller. */
    @GetMapping("/geocode")
    public ResponseEntity<List<GeocodingService.Match>> geocode(@RequestParam("q") String query) {
        return ResponseEntity.ok(geocodingService.search(query));
    }
}
