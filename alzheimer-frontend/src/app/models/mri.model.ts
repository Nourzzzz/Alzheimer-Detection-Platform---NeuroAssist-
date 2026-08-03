export type AlzheimerStage = 'CN' | 'MCI' | 'AD';

export interface CnnResult {
  predictedClass: AlzheimerStage;
  confidence: number;
  probabilities: Record<AlzheimerStage, number>;
}

export type ValidationStatus =
  | 'NOT_READY'
  | 'PENDING_VALIDATION'
  | 'REVISION_REQUESTED'
  | 'VALIDATED'
  | 'CORRECTED'
  | 'REJECTED';

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
  patientGuidance: string | null;
  editedGuidance: string | null;
  revisions: AssessmentRevision[] | null;
  revisionsRemaining: number;
  validationStatus: ValidationStatus;
  correctedStage: AlzheimerStage | null;
  doctorComment: string | null;
  validatedByEmail: string | null;
  validatedAt: string | null;
  createdAt: string;
}

export interface AssessmentRevision {
  round: number;
  rejectedReport: string | null;
  doctorFeedback: string;
  requestedByEmail: string;
  requestedAt: string;
}

export type ValidationAction = 'VALIDATE' | 'CORRECT' | 'REJECT' | 'REQUEST_REVISION';

export interface ValidationRequest {
  action: ValidationAction;
  comment?: string;
  correctedStage?: AlzheimerStage;
  editedReport?: string;
  patientGuidance?: string;
}

export interface PatientAssessmentView {
  id: string;
  validationStatus: ValidationStatus;
  finalStage: AlzheimerStage | null;
  doctorComment: string | null;
  guidance: string | null;
  /** Language the guidance text is written in, which may differ from the UI. */
  guidanceLang: string | null;
  hasGradCam: boolean;
  createdAt: string;
  validatedAt: string | null;
}
