package com.alzheimer.diagnosis_service.Service;

import com.alzheimer.diagnosis_service.Dto.AssessmentGenerationRequest;
import com.alzheimer.diagnosis_service.Dto.AssessmentGenerationResponse;
import com.alzheimer.diagnosis_service.Dto.CnnResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class AiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    public CnnResultDto predictMri(byte[] fileBytes, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        return restTemplate.postForObject(aiServiceUrl + "/predict/mri", requestEntity, CnnResultDto.class);
    }

    public AssessmentGenerationResponse generateAssessment(AssessmentGenerationRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AssessmentGenerationRequest> requestEntity = new HttpEntity<>(request, headers);
        return restTemplate.postForObject(aiServiceUrl + "/rag/assess", requestEntity, AssessmentGenerationResponse.class);
    }

    public Integer indexDocument(String docId, byte[] fileBytes, String filename, String title, String category) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("doc_id", docId);
        body.add("title", title != null ? title : "");
        body.add("category", category != null ? category : "GUIDELINE");
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> resp =
                restTemplate.postForObject(aiServiceUrl + "/knowledge/index", requestEntity, java.util.Map.class);
        if (resp == null || resp.get("chunk_count") == null) {
            return 0;
        }
        return ((Number) resp.get("chunk_count")).intValue();
    }

    public void deleteDocument(String docId) {
        restTemplate.delete(aiServiceUrl + "/knowledge/" + docId);
    }
}
