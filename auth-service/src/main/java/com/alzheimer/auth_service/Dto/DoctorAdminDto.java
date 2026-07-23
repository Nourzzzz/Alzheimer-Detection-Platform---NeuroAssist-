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
public class DoctorAdminDto {
    private String id;
    private String prenom;
    private String nom;
    private String email;
    private String telephone;
    private String specialite;
    private String numeroOrdre;
    private String etablissement;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
