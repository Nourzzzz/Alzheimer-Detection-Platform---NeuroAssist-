import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { AiAssessment } from '../models/mri.model';

@Injectable({ providedIn: 'root' })
export class MriService {

  private apiUrl = `${API_BASE_URL}/medecin/mri`;

  constructor(private http: HttpClient) {}

  upload(patientEmail: string, file: File, clinicalNote = ''): Observable<AiAssessment> {
    const formData = new FormData();
    formData.append('patientEmail', patientEmail);
    formData.append('file', file);
    formData.append('clinicalNote', clinicalNote);
    return this.http.post<AiAssessment>(`${this.apiUrl}/upload`, formData);
  }

  history(patientEmail: string): Observable<AiAssessment[]> {
    return this.http.get<AiAssessment[]>(`${this.apiUrl}/${patientEmail}`);
  }

  gradcamBlob(assessmentId: string): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/medecin/assessments/${assessmentId}/gradcam`, { responseType: 'blob' });
  }
}
