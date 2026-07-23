package com.alzheimer.auth_service.Dto;

import com.alzheimer.auth_service.Entities.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientAdminDto {
    private String id;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String groupeSanguin;
    private String antecedentsMedicaux;
    private String referringDoctorEmail;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
