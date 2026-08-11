package com.alzheimer.auth_service.Geofencing;

import com.alzheimer.auth_service.Entities.User;
import com.alzheimer.auth_service.Geofencing.Dto.LocationRequest;
import com.alzheimer.auth_service.Geofencing.Dto.LocationResponse;
import com.alzheimer.auth_service.Geofencing.Dto.SafeZoneRequest;
import com.alzheimer.auth_service.Geofencing.Entities.Alert;
import com.alzheimer.auth_service.Geofencing.Entities.PatientLocation;
import com.alzheimer.auth_service.Geofencing.Entities.SafeZone;
import com.alzheimer.auth_service.Geofencing.Repositories.AlertRepository;
import com.alzheimer.auth_service.Geofencing.Repositories.PatientLocationRepository;
import com.alzheimer.auth_service.Geofencing.Repositories.SafeZoneRepository;
import com.alzheimer.auth_service.Repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Records positions and decides whether a patient has left their safe zone.
 *
 * <p>All the business logic lives here rather than in the browser: a client can
 * be modified, disabled or simply out of date, and an alert that only fires when
 * the front-end cooperates is not an alert.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeofencingService {

    /** Mean Earth radius, in metres. */
    private static final double EARTH_RADIUS_METERS = 6_371_000;

    private final PatientLocationRepository locationRepository;
    private final SafeZoneRepository safeZoneRepository;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final AlertMailer alertMailer;

    /**
     * A GPS fix is worth 20 to 100 m. Comparing the raw radius would make a
     * motionless patient cross the boundary just from measurement noise.
     */
    @Value("${geofencing.accuracy-margin-meters:30}")
    private double accuracyMargin;

    /**
     * watchPosition() fires every few seconds. Without this, one walk would send
     * the relative hundreds of identical emails.
     */
    @Value("${geofencing.alert-cooldown-minutes:15}")
    private long cooldownMinutes;

    // ── Safe zone ──────────────────────────────────────────────────────────

    public SafeZone saveSafeZone(SafeZoneRequest request, String definedByEmail) {
        SafeZone zone = safeZoneRepository.findByPatientId(request.getPatientId())
                .orElseGet(() -> SafeZone.builder()
                        .patientId(request.getPatientId())
                        .createdAt(LocalDateTime.now())
                        .build());

        zone.setCenterLatitude(request.getCenterLatitude());
        zone.setCenterLongitude(request.getCenterLongitude());
        if (request.getRadius() != null) {
            zone.setRadius(request.getRadius());
        }
        zone.setAddress(request.getAddress());
        zone.setDefinedByEmail(definedByEmail);
        zone.setUpdatedAt(LocalDateTime.now());

        return safeZoneRepository.save(zone);
    }

    public Optional<SafeZone> safeZoneOf(String patientId) {
        return safeZoneRepository.findByPatientId(patientId);
    }

    /** Same, addressed by account email — used by the patient's own space. */
    public Optional<SafeZone> safeZoneOfEmail(String email) {
        return userRepository.findByEmail(email).flatMap(u -> safeZoneRepository.findByPatientId(u.getId()));
    }

    // ── Positions ──────────────────────────────────────────────────────────

    public Optional<PatientLocation> latestLocation(String patientId) {
        return locationRepository.findFirstByPatientIdOrderByTimestampDesc(patientId);
    }

    public List<PatientLocation> locationHistory(String patientId) {
        return locationRepository.findByPatientIdOrderByTimestampDesc(patientId);
    }

    public List<Alert> alertsOf(String patientId) {
        return alertRepository.findByPatientIdOrderByTimestampDesc(patientId);
    }

    /**
     * Stores a fix, evaluates it against the safe zone, and raises an alert when
     * the patient has genuinely left it.
     */
    public LocationResponse recordLocation(String patientId, LocationRequest request) {
        LocalDateTime at = request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now();
        SafeZone zone = safeZoneRepository.findByPatientId(patientId).orElse(null);

        // Read before saving: it tells us whether this is a fresh departure.
        PatientLocation previous = locationRepository
                .findFirstByPatientIdOrderByTimestampDesc(patientId).orElse(null);

        PatientLocation fix = PatientLocation.builder()
                .patientId(patientId)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .accuracy(request.getAccuracy())
                .source(request.getSource() == null || request.getSource().isBlank()
                        ? "browser" : request.getSource())
                .timestamp(at)
                .build();

        if (zone == null) {
            locationRepository.save(fix);
            return LocationResponse.builder()
                    .patientId(patientId)
                    .latitude(fix.getLatitude())
                    .longitude(fix.getLongitude())
                    .timestamp(at)
                    .safeZoneDefined(false)
                    .insideSafeZone(true)
                    .message("Position recorded. No safe zone defined for this patient yet.")
                    .build();
        }

        double distance = haversineMeters(zone.getCenterLatitude(), zone.getCenterLongitude(),
                request.getLatitude(), request.getLongitude());
        double accuracy = request.getAccuracy() == null ? 0 : request.getAccuracy();
        double threshold = zone.getRadius() + accuracy + accuracyMargin;
        boolean outside = distance > threshold;

        fix.setDistanceFromCentre(Math.round(distance * 10.0) / 10.0);
        fix.setInsideSafeZone(!outside);
        locationRepository.save(fix);

        boolean alertRaised = false;
        String message;

        if (!outside) {
            message = "Inside the safe zone.";
        } else if (shouldAlert(previous, patientId)) {
            alertRaised = raiseAlert(patientId, zone, fix, distance, at);
            message = alertRaised
                    ? "Safe-zone exit: the emergency contact has been notified."
                    : "Safe-zone exit detected, but the contact could not be notified.";
        } else {
            message = "Outside the safe zone; an alert was already sent recently.";
        }

        return LocationResponse.builder()
                .patientId(patientId)
                .latitude(fix.getLatitude())
                .longitude(fix.getLongitude())
                .timestamp(at)
                .safeZoneDefined(true)
                .insideSafeZone(!outside)
                .distanceFromCentre(fix.getDistanceFromCentre())
                .radius(zone.getRadius())
                .alertRaised(alertRaised)
                .message(message)
                .build();
    }

    /**
     * A fresh departure always alerts; staying outside only alerts once per
     * cooldown window. Coming home therefore re-arms the alert immediately.
     */
    private boolean shouldAlert(PatientLocation previous, String patientId) {
        boolean freshDeparture = previous == null || !Boolean.FALSE.equals(previous.getInsideSafeZone());
        if (freshDeparture) {
            return true;
        }
        return alertRepository.findFirstByPatientIdOrderByTimestampDesc(patientId)
                .map(last -> Duration.between(last.getTimestamp(), LocalDateTime.now())
                        .toMinutes() >= cooldownMinutes)
                .orElse(true);
    }

    private boolean raiseAlert(String patientId, SafeZone zone, PatientLocation fix,
                               double distance, LocalDateTime at) {
        User patient = userRepository.findById(patientId).orElse(null);
        if (patient == null) {
            log.warn("Safe-zone exit for unknown patient id {}", patientId);
            return false;
        }

        String failure = alertMailer.sendZoneExit(patient, zone, fix.getLatitude(), fix.getLongitude(),
                distance, at);

        alertRepository.save(Alert.builder()
                .patientId(patientId)
                .type(Alert.OUTSIDE_SAFE_ZONE)
                .message("%s est sorti(e) de sa zone de sécurité (%d m du domicile, rayon %d m)."
                        .formatted(displayName(patient), (int) Math.round(distance), zone.getRadius()))
                .latitude(fix.getLatitude())
                .longitude(fix.getLongitude())
                .distanceFromCentre(Math.round(distance * 10.0) / 10.0)
                .timestamp(at)
                .notifiedEmail(patient.getContactUrgenceEmail())
                .emailSent(failure == null)
                .deliveryNote(failure)
                .build());

        return failure == null;
    }

    private String displayName(User patient) {
        String name = ((patient.getPrenom() == null ? "" : patient.getPrenom()) + " "
                + (patient.getNom() == null ? "" : patient.getNom())).trim();
        return name.isBlank() ? patient.getEmail() : name;
    }

    public User requirePatient(String patientId) {
        User user = userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Patient not found: " + patientId));
        if (!"PATIENT".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This account is not a patient");
        }
        return user;
    }

    /**
     * Great-circle distance between two points, in metres.
     *
     * <p>Haversine is accurate to a few metres over the distances a safe zone
     * covers, and needs no external dependency.
     */
    public static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
