package com.alzheimer.diagnosis_service.Repositories;

import com.alzheimer.diagnosis_service.Entities.KnowledgeCategory;
import com.alzheimer.diagnosis_service.Entities.KnowledgeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface KnowledgeDocumentRepository extends MongoRepository<KnowledgeDocument, String> {
    List<KnowledgeDocument> findAllByOrderByUploadedAtDesc();
    List<KnowledgeDocument> findByCategoryOrderByUploadedAtDesc(KnowledgeCategory category);
}
