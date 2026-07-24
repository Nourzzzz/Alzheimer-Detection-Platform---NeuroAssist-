export type AlzheimerStage = 'CN' | 'MCI' | 'AD';

export interface CnnResult {
  predictedClass: AlzheimerStage;
  confidence: number;
  probabilities: Record<AlzheimerStage, number>;
}

export type ValidationStatus = 'NOT_READY' | 'PENDING_VALIDATION' | 'VALIDATED' | 'CORRECTED' | 'REJECTED';

export interface AiAssessment {
  id: string;
  mriScanId: string;
  patientEmail: string;
  cnnResult: CnnResult;
  riskScore: number;
  stage: AlzheimerStage;
  hasGradCam: boolean;
  validationStatus: ValidationStatus;
  correctedStage: AlzheimerStage | null;
  createdAt: string;
}

export interface ClinicalBertExtraction {
  symptoms: string[];
  treatments: string[];
  conditions?: string[];
  history?: string[];
}

export interface RagContextRef {
  source: string;
  docId: string;
  snippet: string;
  score: number;
}

export interface AssessmentSummary {
  id: string;
  patientEmail: string;
  stage: AlzheimerStage;
  riskScore: number;
  confidence: number;
  validationStatus: ValidationStatus;
  createdAt: string;
}

export interface AssessmentDetail {
  id: string;
  mriScanId: string;
  patientEmail: string;
  doctorEmail: string | null;
  cnnResult: CnnResult;
  riskScore: number;
  stage: AlzheimerStage;
  hasGradCam: boolean;
  clinicalBertExtraction: ClinicalBertExtraction | null;
  ragContextRefs: RagContextRef[] | null;
  generatedReport: string | null;
  editedReport: string | null;
  validationStatus: ValidationStatus;
  correctedStage: AlzheimerStage | null;
  doctorComment: string | null;
  validatedByEmail: string | null;
  validatedAt: string | null;
  createdAt: string;
}

export type ValidationAction = 'VALIDATE' | 'CORRECT' | 'REJECT';

export interface ValidationRequest {
  action: ValidationAction;
  comment?: string;
  correctedStage?: AlzheimerStage;
  editedReport?: string;
}

export interface PatientAssessmentView {
  id: string;
  validationStatus: ValidationStatus;
  message: string;
  finalStage: AlzheimerStage | null;
  doctorComment: string | null;
  report: string | null;
  hasGradCam: boolean;
  createdAt: string;
  validatedAt: string | null;
}
