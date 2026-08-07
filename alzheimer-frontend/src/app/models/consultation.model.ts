export interface ConsultationAssessment {
  id: string;
  patientEmail: string;
  stage: string;
  riskScore: number;
  confidence: number;
  validationStatus: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  patientEmail: string;
  doctorEmail: string;
  reason: string;
  occurredAt: string;
  symptoms?: string;
  medicalHistory?: string;
  treatments?: string;
  observations?: string;
  assessments: ConsultationAssessment[];
  createdAt: string;
  updatedAt?: string;
}

export interface ConsultationRequest {
  reason: string;
  occurredAt?: string;
  symptoms?: string;
  medicalHistory?: string;
  treatments?: string;
  observations?: string;
}
