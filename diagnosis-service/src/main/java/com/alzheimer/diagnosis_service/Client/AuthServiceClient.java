package com.alzheimer.diagnosis_service.Client;

import com.alzheimer.diagnosis_service.Dto.UserSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service")
public interface AuthServiceClient {

    @GetMapping("/internal/users/{email}")
    UserSummaryDto getUserByEmail(@PathVariable("email") String email);
}
