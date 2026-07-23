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
public class DocumentStorageService {

    @Value("${kb.storage-path}")
    private String storagePath;

    public String store(MultipartFile file) throws IOException {
        Path dir = Path.of(storagePath);
        Files.createDirectories(dir);

        String storedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path target = dir.resolve(storedName);
        file.transferTo(target);

        return target.toString();
    }

    public void delete(String storedFilePath) {
        if (storedFilePath == null) {
            return;
        }
        try {
            Files.deleteIfExists(Path.of(storedFilePath));
        } catch (IOException ignored) {
        }
    }
}
