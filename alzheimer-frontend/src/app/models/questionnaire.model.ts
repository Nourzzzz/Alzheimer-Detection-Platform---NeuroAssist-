export interface QuestionOption {
  value: number;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export interface Answer {
  questionId: string;
  value: number;
}

export interface QuestionnaireSubmitRequest {
  answers: Answer[];
}

export type RiskBucket = 'Low' | 'Moderate' | 'Further Evaluation Recommended';

export interface QuestionnaireResult {
  id: string;
  score: number;
  maxScore: number;
  riskBucket: RiskBucket;
  createdAt: string;
}

export interface RecentActivity {
  patientName: string;
  score: number;
  maxScore: number;
  riskBucket: RiskBucket;
  createdAt: string;
}
