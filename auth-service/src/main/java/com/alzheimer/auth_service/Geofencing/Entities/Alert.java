package com.alzheimer.auth_service.Geofencing.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** Record of one safe-zone exit and of the email that followed. */
@Document(collection = "alerts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

    public static final String OUTSIDE_SAFE_ZONE = "OUTSIDE_SAFE_ZONE";

    @Id
    private String id;

    @Indexed
    private String patientId;

    @Builder.Default
    private String type = OUTSIDE_SAFE_ZONE;

    private String message;
    private double latitude;
    private double longitude;

    /** How far beyond the zone the patient was, in metres. */
    private double distanceFromCentre;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    private String notifiedEmail;
    private boolean emailSent;
    /** Why delivery did not happen, when it did not. */
    private String deliveryNote;
}
