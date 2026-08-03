import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { CognitiveCompletionStatus, CognitiveLatestSummary, CognitiveTurn } from '../models/cognitive.model';

@Injectable({ providedIn: 'root' })
export class CognitiveQuestionnaireService {
  private readonly http = inject(HttpClient);
  private readonly patientUrl = `${API_BASE_URL}/patient/cognitive`;
  private readonly medecinUrl = `${API_BASE_URL}/medecin/cognitive`;

  start(): Observable<CognitiveTurn> {
    return this.http.post<CognitiveTurn>(`${this.patientUrl}/start`, {});
  }

  answer(sessionId: string, answer: string): Observable<CognitiveTurn> {
    return this.http.post<CognitiveTurn>(`${this.patientUrl}/${sessionId}/answer`, { answer });
  }

  latestForMe(): Observable<CognitiveCompletionStatus> {
    return this.http.get<CognitiveCompletionStatus>(`${this.patientUrl}/latest`);
  }

  latestForPatient(email: string): Observable<CognitiveLatestSummary> {
    return this.http.get<CognitiveLatestSummary>(`${this.medecinUrl}/latest/${encodeURIComponent(email)}`);
  }
}
