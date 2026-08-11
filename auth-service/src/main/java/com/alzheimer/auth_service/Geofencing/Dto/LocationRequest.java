package com.alzheimer.auth_service.Geofencing.Dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * One position fix, whatever produced it.
 *
 * <p>Deliberately source-agnostic: the browser, the demo simulator and — later —
 * a native mobile app or a GPS tracker all post this same payload, so the
 * geofencing logic never depends on where the position came from.
 */
@Data
public class LocationRequest {

    /**
     * Optional. Ignored for a patient, who can only report their own position;
     * a doctor may supply it to feed a position on the patient's behalf.
     */
    private String patientId;

    @NotNull(message = "latitude is required")
    @Min(value = -90, message = "latitude must be between -90 and 90")
    @Max(value = 90, message = "latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "longitude is required")
    @Min(value = -180, message = "longitude must be between -180 and 180")
    @Max(value = 180, message = "longitude must be between -180 and 180")
    private Double longitude;

    /** Reading precision in metres, as reported by the browser. */
    private Double accuracy;

    /** "browser" or "demo"; defaults to "browser". */
    private String source;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
}
