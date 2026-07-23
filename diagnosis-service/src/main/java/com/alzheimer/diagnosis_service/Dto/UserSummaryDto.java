package com.alzheimer.diagnosis_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserSummaryDto {
    private String email;
    private String prenom;
    private String nom;
    private String referringDoctorEmail;
}
