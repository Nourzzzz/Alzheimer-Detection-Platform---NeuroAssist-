import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  Consultation,
  ConsultationAssessment,
  ConsultationRequest,
} from '../models/consultation.model';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/medecin/consultations`;

  timeline(email: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.url}/${encodeURIComponent(email)}`);
  }

  /** Assessments created before the file was organised into visits. */
  unfiled(email: string): Observable<ConsultationAssessment[]> {
    return this.http.get<ConsultationAssessment[]>(`${this.url}/${encodeURIComponent(email)}/unfiled`);
  }

  create(email: string, request: ConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.url}/${encodeURIComponent(email)}`, request);
  }

  update(id: string, request: ConsultationRequest): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.url}/visit/${id}`, request);
  }
}
