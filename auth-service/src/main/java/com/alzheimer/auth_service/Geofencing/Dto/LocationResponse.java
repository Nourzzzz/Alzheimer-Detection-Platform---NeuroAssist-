package com.alzheimer.auth_service.Geofencing.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** What the caller learns back after reporting a position. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationResponse {

    private String patientId;
    private double latitude;
    private double longitude;
    private LocalDateTime timestamp;

    /** False when no safe zone has been defined yet: nothing is evaluated. */
    private boolean safeZoneDefined;
    private boolean insideSafeZone;
    private double distanceFromCentre;
    private int radius;

    /** True when this fix produced an alert (and therefore an email attempt). */
    private boolean alertRaised;
    private String message;
}
