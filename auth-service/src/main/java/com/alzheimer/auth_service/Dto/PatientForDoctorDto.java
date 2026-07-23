package com.alzheimer.auth_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientForDoctorDto {
    private String id;
    private String firstName;
    private String lastName;
    private LocalDateTime dateOfBirth;
    private String gender;
    private String email;
    private String phone;
    private LocalDateTime createdAt;
}
