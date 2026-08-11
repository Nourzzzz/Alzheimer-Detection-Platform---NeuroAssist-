package com.alzheimer.auth_service.Dto;

import com.alzheimer.auth_service.Entities.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientDetailDto {
    private String id;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String adresse;
    private String genre;
    /**
     * A date of birth, not a timestamp. It must serialise the same way
     * {@code UpdatePatientRequest} expects to read it, otherwise the value this
     * endpoint returns cannot be sent back to it.
     */
    private LocalDate dateNaissance;
    private String groupeSanguin;
    private String antecedentsMedicaux;

    private String contactUrgenceNom;
    private String contactUrgenceEmail;
    private String contactUrgenceLien;

    private String referringDoctorEmail;
    private AccountStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
