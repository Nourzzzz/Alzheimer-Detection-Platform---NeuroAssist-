package com.alzheimer.auth_service.Dto;

import com.alzheimer.auth_service.Entities.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private AccountStatus status;
}
