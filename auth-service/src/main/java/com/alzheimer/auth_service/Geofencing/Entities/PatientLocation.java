package com.alzheimer.auth_service.Geofencing.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * One GPS fix reported for a patient.
 *
 * <p>Every fix is kept so the doctor can replay the patient's movements. The
 * source is recorded because a browser reading, a simulated one and — later — a
 * dedicated tracker must remain distinguishable when reviewing a history.
 */
@Document(collection = "patient_locations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientLocation {

    @Id
    private String id;

    @Indexed
    private String patientId;

    private double latitude;
    private double longitude;

    /** Reading precision in metres, as reported by the device. */
    private Double accuracy;

    /** Distance to the safe-zone centre at the time of the fix, in metres. */
    private Double distanceFromCentre;
    private Boolean insideSafeZone;

    /** "browser", "demo" or, in a future version, "tracker". */
    private String source;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
