package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Entities.IndexingStatus;
import com.alzheimer.diagnosis_service.Entities.KnowledgeCategory;
import com.alzheimer.diagnosis_service.Entities.KnowledgeDocument;
import com.alzheimer.diagnosis_service.Repositories.KnowledgeDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeBaseService {

    private final KnowledgeDocumentRepository repository;
    private final DocumentStorageService documentStorageService;
    private final AiServiceClient aiServiceClient;

    public KnowledgeDocument upload(String title, String description, KnowledgeCategory category,
                                    MultipartFile file, String uploadedByEmail) {
        String storedPath;
        try {
            storedPath = documentStorageService.store(file);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not store document: " + e.getMessage());
        }

        KnowledgeDocument doc = KnowledgeDocument.builder()
                .title(title)
                .description(description)
                .category(category)
                .originalFilename(file.getOriginalFilename())
                .storedFilePath(storedPath)
                .fileSizeBytes(file.getSize())
                .contentType(file.getContentType())
                .uploadedByEmail(uploadedByEmail)
                .indexingStatus(IndexingStatus.PENDING)
                .uploadedAt(LocalDateTime.now())
                .build();
        doc = repository.save(doc);

        try {
            int chunks = aiServiceClient.indexDocument(
                    doc.getId(), readBytes(file), file.getOriginalFilename(),
                    title, category != null ? category.name() : KnowledgeCategory.OTHER.name());
            doc.setChunkCount(chunks);
            doc.setIndexingStatus(chunks > 0 ? IndexingStatus.INDEXED : IndexingStatus.FAILED);
        } catch (Exception e) {
            log.error("Indexing document {} failed", doc.getId(), e);
            doc.setIndexingStatus(IndexingStatus.FAILED);
        }
        return repository.save(doc);
    }

    public List<KnowledgeDocument> list(KnowledgeCategory category) {
        return category == null
                ? repository.findAllByOrderByUploadedAtDesc()
                : repository.findByCategoryOrderByUploadedAtDesc(category);
    }

    public KnowledgeDocument get(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found: " + id));
    }

    public void delete(String id) {
        KnowledgeDocument doc = get(id);
        try {
            aiServiceClient.deleteDocument(id);
        } catch (Exception e) {
            log.warn("Could not delete vectors for document {}: {}", id, e.getMessage());
        }
        documentStorageService.delete(doc.getStoredFilePath());
        repository.deleteById(id);
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not read uploaded document: " + e.getMessage());
        }
    }
}
