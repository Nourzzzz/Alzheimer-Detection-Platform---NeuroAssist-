package com.alzheimer.diagnosis_service.Entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "knowledge_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocument {

    @Id
    private String id;

    private String title;
    private String description;
    private KnowledgeCategory category;

    private String originalFilename;
    private String storedFilePath;
    private long fileSizeBytes;
    private String contentType;

    private String uploadedByEmail;

    @Builder.Default
    private IndexingStatus indexingStatus = IndexingStatus.PENDING;
    private int chunkCount;

    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
