import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { ClinicalRecord, ClinicalRecordRequest } from '../models/clinical.model';

@Injectable({ providedIn: 'root' })
export class ClinicalRecordService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/medecin/clinical-records`;

  get(email: string): Observable<ClinicalRecord> {
    return this.http.get<ClinicalRecord>(`${this.url}/${encodeURIComponent(email)}`);
  }

  exists(email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.url}/${encodeURIComponent(email)}/exists`);
  }

  save(email: string, request: ClinicalRecordRequest): Observable<ClinicalRecord> {
    return this.http.post<ClinicalRecord>(`${this.url}/${encodeURIComponent(email)}`, request);
  }
}
