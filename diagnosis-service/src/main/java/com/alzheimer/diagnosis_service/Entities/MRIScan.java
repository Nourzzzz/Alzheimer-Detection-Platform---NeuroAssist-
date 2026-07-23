package com.alzheimer.diagnosis_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "mri_scans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MRIScan {

    @Id
    private String id;

    private String patientEmail;
    private String doctorEmail;
    private String originalFilename;
    private String storedFilePath;
    private long fileSizeBytes;
    private String contentType;
    private MriScanStatus status;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
