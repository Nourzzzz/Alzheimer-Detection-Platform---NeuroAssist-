package com.alzheimer.auth_service.Dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateReferringDoctorRequest {

    @NotBlank(message = "Referring doctor email is required")
    private String referringDoctorEmail;
}
