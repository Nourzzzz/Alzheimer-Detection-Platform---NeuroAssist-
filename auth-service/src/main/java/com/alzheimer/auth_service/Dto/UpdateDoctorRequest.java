package com.alzheimer.auth_service.Dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateDoctorRequest {

    @NotBlank(message = "First name is required")
    private String prenom;

    @NotBlank(message = "Last name is required")
    private String nom;

    @NotBlank(message = "Phone number is required")
    private String telephone;

    private String specialite;
    private String numeroOrdre;
    private String etablissement;
}
