package com.alzheimer.auth_service.Geofencing.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** The area a patient is expected to stay within, centred on their home. */
@Document(collection = "safe_zones")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafeZone {

    @Id
    private String id;

    /** One zone per patient: saving again updates the existing one. */
    @Indexed(unique = true)
    private String patientId;

    private double centerLatitude;
    private double centerLongitude;

    @Builder.Default
    private int radius = 150;

    /** Address the centre was picked from, kept for display only. */
    private String address;

    private String definedByEmail;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
