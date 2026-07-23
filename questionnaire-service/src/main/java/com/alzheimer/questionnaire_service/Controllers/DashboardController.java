package com.alzheimer.questionnaire_service.Controllers;

import com.alzheimer.questionnaire_service.Dto.RecentActivityDto;
import com.alzheimer.questionnaire_service.Service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/medecin/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/recent-activity")
    public ResponseEntity<List<RecentActivityDto>> recentActivity() {
        return ResponseEntity.ok(dashboardService.recentActivity());
    }
}
