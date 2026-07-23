package com.alzheimer.auth_service.Controllers;

import com.alzheimer.auth_service.Dto.CreatePatientRequest;
import com.alzheimer.auth_service.Dto.PatientDetailDto;
import com.alzheimer.auth_service.Dto.PatientForDoctorDto;
import com.alzheimer.auth_service.Dto.UpdatePatientRequest;
import com.alzheimer.auth_service.Service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medecin/patients")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping("")
    public ResponseEntity<List<PatientForDoctorDto>> listMine(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived) {
        return ResponseEntity.ok(doctorService.listMyPatients(search, includeArchived));
    }

    @PostMapping("")
    public ResponseEntity<PatientDetailDto> create(@Valid @RequestBody CreatePatientRequest request) {
        return ResponseEntity.ok(doctorService.createPatient(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDetailDto> get(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.getMyPatient(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDetailDto> update(@PathVariable String id,
                                                     @Valid @RequestBody UpdatePatientRequest request) {
        return ResponseEntity.ok(doctorService.updateMyPatient(id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<PatientDetailDto> archive(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.archivePatient(id));
    }

    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<PatientDetailDto> unarchive(@PathVariable String id) {
        return ResponseEntity.ok(doctorService.unarchivePatient(id));
    }
}
