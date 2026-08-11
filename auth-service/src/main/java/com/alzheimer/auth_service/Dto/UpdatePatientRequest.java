package com.alzheimer.auth_service.Dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Email;
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
    @JsonDeserialize(using = LenientLocalDateDeserializer.class)
    private LocalDate dateNaissance;

    private String groupeSanguin;
    private String antecedentsMedicaux;

    private String contactUrgenceNom;
    @Email(message = "The emergency contact email is not valid")
    private String contactUrgenceEmail;
    private String contactUrgenceLien;
}
