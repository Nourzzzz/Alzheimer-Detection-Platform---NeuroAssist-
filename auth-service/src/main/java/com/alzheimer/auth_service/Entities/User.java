package com.alzheimer.auth_service.Entities;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String role;

    private String prenom;
    private String nom;
    private String telephone;
    private String adresse;
    private String genre;
    private LocalDateTime dateNaissance;

    private String specialite;
    private String numeroOrdre;
    private String etablissement;

    private String groupeSanguin;
    private String antecedentsMedicaux;
    private String nomMedecinReferent;

    /** Relative warned when the patient leaves their safe zone. */
    private String contactUrgenceNom;
    private String contactUrgenceEmail;
    private String contactUrgenceLien;

    private String referringDoctorEmail;

    private AccountStatus status;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}
