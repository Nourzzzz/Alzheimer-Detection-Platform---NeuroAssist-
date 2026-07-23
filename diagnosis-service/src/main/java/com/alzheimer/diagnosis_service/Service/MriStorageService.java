package com.alzheimer.diagnosis_service.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MriStorageService {

    @Value("${mri.storage-path}")
    private String storagePath;

    public String store(String patientEmail, MultipartFile file) throws IOException {
        Path patientDir = Path.of(storagePath, patientEmail);
        Files.createDirectories(patientDir);

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path target = patientDir.resolve(storedName);
        file.transferTo(target);

        return target.toString();
    }

    public String storeBytes(String patientEmail, String filename, byte[] data) throws IOException {
        Path patientDir = Path.of(storagePath, patientEmail);
        Files.createDirectories(patientDir);

        String storedName = UUID.randomUUID() + "_" + filename;
        Path target = patientDir.resolve(storedName);
        Files.write(target, data);

        return target.toString();
    }
}
