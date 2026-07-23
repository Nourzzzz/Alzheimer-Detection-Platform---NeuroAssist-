package com.alzheimer.diagnosis_service.Controllers;

import com.alzheimer.diagnosis_service.Entities.KnowledgeCategory;
import com.alzheimer.diagnosis_service.Entities.KnowledgeDocument;
import com.alzheimer.diagnosis_service.Service.KnowledgeBaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/medecin/knowledge-base")
@RequiredArgsConstructor
public class KnowledgeBaseController {

    private final KnowledgeBaseService knowledgeBaseService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<KnowledgeDocument> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "category", defaultValue = "OTHER") KnowledgeCategory category) {
        String doctorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(knowledgeBaseService.upload(title, description, category, file, doctorEmail));
    }

    @GetMapping
    public ResponseEntity<List<KnowledgeDocument>> list(
            @RequestParam(value = "category", required = false) KnowledgeCategory category) {
        return ResponseEntity.ok(knowledgeBaseService.list(category));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<FileSystemResource> download(@PathVariable String id) {
        KnowledgeDocument doc = knowledgeBaseService.get(id);
        File file = new File(doc.getStoredFilePath());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new FileSystemResource(file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        knowledgeBaseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
