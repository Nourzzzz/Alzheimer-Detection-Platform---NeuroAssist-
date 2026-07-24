import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  CreatePatientRequest,
  PatientDetail,
  PatientResponse,
  UpdatePatientRequest
} from '../models/patient.model';

@Injectable({ providedIn: 'root' })
export class PatientService {

  private apiUrl = `${API_BASE_URL}/medecin/patients`;

  constructor(private http: HttpClient) {}

  listMine(search?: string, includeArchived = false): Observable<PatientResponse[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (includeArchived) params = params.set('includeArchived', 'true');
    return this.http.get<PatientResponse[]>(this.apiUrl, { params });
  }

  create(request: CreatePatientRequest): Observable<PatientDetail> {
    return this.http.post<PatientDetail>(this.apiUrl, request);
  }

  get(id: string): Observable<PatientDetail> {
    return this.http.get<PatientDetail>(`${this.apiUrl}/${id}`);
  }

  update(id: string, request: UpdatePatientRequest): Observable<PatientDetail> {
    return this.http.put<PatientDetail>(`${this.apiUrl}/${id}`, request);
  }

  archive(id: string): Observable<PatientDetail> {
    return this.http.patch<PatientDetail>(`${this.apiUrl}/${id}/archive`, {});
  }

  unarchive(id: string): Observable<PatientDetail> {
    return this.http.patch<PatientDetail>(`${this.apiUrl}/${id}/unarchive`, {});
  }
}
