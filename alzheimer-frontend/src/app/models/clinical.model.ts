export interface ClinicalRecord {
  id: string;
  patientEmail: string;
  symptoms: string;
  medicalHistory: string;
  treatments: string;
  observations: string;
  cognitiveScores?: string;
  createdByEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicalRecordRequest {
  symptoms: string;
  medicalHistory: string;
  treatments: string;
  observations: string;
  cognitiveScores?: string;
}

export interface ClinicalDataRequired {
  code: 'CLINICAL_DATA_REQUIRED';
  message: string;
  missingClinicalRecord: boolean;
  missingCognitiveQuestionnaire: boolean;
}
