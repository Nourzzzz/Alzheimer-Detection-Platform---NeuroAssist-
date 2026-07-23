package com.alzheimer.questionnaire_service.Service;

import com.alzheimer.questionnaire_service.Client.AuthServiceClient;
import com.alzheimer.questionnaire_service.Dto.RecentActivityDto;
import com.alzheimer.questionnaire_service.Dto.UserSummaryDto;
import com.alzheimer.questionnaire_service.Entities.QuestionnaireResponse;
import com.alzheimer.questionnaire_service.Repositories.QuestionnaireResponseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final QuestionnaireResponseRepository questionnaireResponseRepository;
    private final AuthServiceClient authServiceClient;

    public List<RecentActivityDto> recentActivity() {
        return questionnaireResponseRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toRecentActivityDto)
                .toList();
    }

    private RecentActivityDto toRecentActivityDto(QuestionnaireResponse response) {
        String patientName = resolvePatientName(response.getPatientEmail());

        return RecentActivityDto.builder()
                .patientName(patientName)
                .score(response.getScore())
                .maxScore(response.getMaxScore())
                .riskBucket(response.getRiskBucket())
                .createdAt(response.getCreatedAt())
                .build();
    }

    private String resolvePatientName(String patientEmail) {
        try {
            UserSummaryDto user = authServiceClient.getUserByEmail(patientEmail);
            return user.getPrenom() + " " + user.getNom();
        } catch (Exception e) {
            log.warn("Could not resolve display name for {} from auth-service: {}", patientEmail, e.getMessage());
            return patientEmail;
        }
    }
}
