package com.alzheimer.auth_service.Geofencing.Dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SafeZoneRequest {

    @NotNull(message = "patientId is required")
    private String patientId;

    @NotNull(message = "centerLatitude is required")
    @Min(value = -90, message = "centerLatitude must be between -90 and 90")
    @Max(value = 90, message = "centerLatitude must be between -90 and 90")
    private Double centerLatitude;

    @NotNull(message = "centerLongitude is required")
    @Min(value = -180, message = "centerLongitude must be between -180 and 180")
    @Max(value = 180, message = "centerLongitude must be between -180 and 180")
    private Double centerLongitude;

    /** Metres. Below 50 m the GPS noise alone would trigger exits. */
    @Min(value = 50, message = "radius must be at least 50 metres")
    private Integer radius;

    private String address;
}
