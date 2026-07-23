package com.alzheimer.auth_service.Controllers;

import com.alzheimer.auth_service.Dto.CreateDoctorRequest;
import com.alzheimer.auth_service.Dto.DoctorAdminDto;
import com.alzheimer.auth_service.Dto.PatientAdminDto;
import com.alzheimer.auth_service.Dto.UpdateDoctorRequest;
import com.alzheimer.auth_service.Dto.UpdateReferringDoctorRequest;
import com.alzheimer.auth_service.Dto.UpdateStatusRequest;
import com.alzheimer.auth_service.Entities.AccountStatus;
import com.alzheimer.auth_service.Service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorAdminDto>> listDoctors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AccountStatus status) {
        return ResponseEntity.ok(adminService.listDoctors(search, status));
    }

    @PostMapping("/doctors")
    public ResponseEntity<DoctorAdminDto> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        return ResponseEntity.ok(adminService.createDoctor(request));
    }

    @PutMapping("/doctors/{id}")
    public ResponseEntity<DoctorAdminDto> updateDoctor(@PathVariable String id,
                                                        @Valid @RequestBody UpdateDoctorRequest request) {
        return ResponseEntity.ok(adminService.updateDoctor(id, request));
    }

    @PatchMapping("/doctors/{id}/status")
    public ResponseEntity<DoctorAdminDto> setDoctorStatus(@PathVariable String id,
                                                           @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(adminService.setDoctorStatus(id, request.getStatus()));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<PatientAdminDto>> listPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AccountStatus status) {
        return ResponseEntity.ok(adminService.listPatients(search, status));
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<PatientAdminDto> getPatient(@PathVariable String id) {
        return ResponseEntity.ok(adminService.getPatient(id));
    }

    @PatchMapping("/patients/{id}/status")
    public ResponseEntity<PatientAdminDto> setPatientStatus(@PathVariable String id,
                                                             @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(adminService.setPatientStatus(id, request.getStatus()));
    }

    @PatchMapping("/patients/{id}/referring-doctor")
    public ResponseEntity<PatientAdminDto> setPatientReferringDoctor(@PathVariable String id,
                                                                      @Valid @RequestBody UpdateReferringDoctorRequest request) {
        return ResponseEntity.ok(adminService.setPatientReferringDoctor(id, request.getReferringDoctorEmail()));
    }
}
