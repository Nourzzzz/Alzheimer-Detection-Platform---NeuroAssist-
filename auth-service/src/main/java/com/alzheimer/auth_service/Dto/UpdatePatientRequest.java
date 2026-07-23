package com.alzheimer.auth_service.Dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdatePatientRequest {

    @NotBlank(message = "First name is required")
    private String prenom;

    @NotBlank(message = "Last name is required")
    private String nom;

    private String telephone;
    private String adresse;
    private String genre;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateNaissance;

    private String groupeSanguin;
    private String antecedentsMedicaux;
}
