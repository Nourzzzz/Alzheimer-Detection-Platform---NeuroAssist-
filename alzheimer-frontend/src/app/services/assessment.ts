import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  AssessmentDetail,
  AssessmentSummary,
  PatientAssessmentView,
  ValidationRequest,
} from '../models/mri.model';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly http = inject(HttpClient);
  private readonly doctorUrl = `${API_BASE_URL}/medecin/assessments`;
  private readonly patientUrl = `${API_BASE_URL}/patient/mri`;

  pending(): Observable<AssessmentSummary[]> {
    return this.http.get<AssessmentSummary[]>(`${this.doctorUrl}/pending`);
  }

  pendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.doctorUrl}/pending/count`);
  }

  detail(id: string): Observable<AssessmentDetail> {
    return this.http.get<AssessmentDetail>(`${this.doctorUrl}/${id}`);
  }

  validate(id: string, request: ValidationRequest): Observable<AssessmentDetail> {
    return this.http.post<AssessmentDetail>(`${this.doctorUrl}/${id}/validate`, request);
  }

  gradcamBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.doctorUrl}/${id}/gradcam`, { responseType: 'blob' });
  }

  myResults(): Observable<PatientAssessmentView[]> {
    return this.http.get<PatientAssessmentView[]>(`${this.patientUrl}/results`);
  }
}
