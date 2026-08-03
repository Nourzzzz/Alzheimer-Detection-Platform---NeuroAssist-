package com.alzheimer.diagnosis_service.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientAssessmentView {
    private String id;
    /** The wording shown for this status is built and translated by the client. */
    private String validationStatus;

    private String finalStage;
    private String doctorComment;
    /** No clinical report here: the patient gets the guidance text, the doctor keeps the report. */
    private String guidance;
    /** Language the guidance is actually written in, which can differ from the
     *  one requested when only the other language was reviewed by a doctor. */
    private String guidanceLang;
    private boolean hasGradCam;
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
}
