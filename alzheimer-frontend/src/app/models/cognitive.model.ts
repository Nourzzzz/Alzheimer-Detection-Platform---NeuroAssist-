export interface CognitiveOption {
  value: string;
  label: string;
}

export interface CognitiveQuestion {
  node_id: string;
  text: string;
  answer_type: string;
  options: CognitiveOption[];
  is_follow_up: boolean;
  forced_choice: boolean;
}

export interface CognitiveScale {
  label: string;
  score: number;
  max: number;
  cutoff: number;
  flag: 'above_cutoff' | 'within_range';
}

export interface CognitiveGlobalRisk {
  level: 'low' | 'moderate' | 'high';
  label: string;
  flaggedScales: string[];
}

export interface CognitiveDomain {
  domain: string;
  label: string;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  findings: string[];
}

export interface CognitiveTranscriptEntry {
  nodeId: string;
  value: string;
  score: number;
  isFollowUp: boolean;
}

export interface CognitiveSummary {
  treeVersion: string;
  questionsAsked: number;
  scores: Record<string, CognitiveScale>;
  globalRisk: CognitiveGlobalRisk;
  domains: CognitiveDomain[];
  redFlags: string[];
  narrative: string;
  transcript: CognitiveTranscriptEntry[];
}

export interface CognitiveLatestSummary extends CognitiveSummary {
  exists: boolean;
}

/** All the patient's own space is allowed to know: whether a run was completed. */
export interface CognitiveCompletionStatus {
  exists: boolean;
  completedAt?: string;
}

export interface CognitiveTurn {
  sessionId: string;
  finished: boolean;
  question: CognitiveQuestion | null;
}
