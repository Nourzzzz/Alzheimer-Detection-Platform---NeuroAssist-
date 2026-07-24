import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  AccountStatus,
  CreateDoctorRequest,
  DoctorAdmin,
  PatientAdmin,
  UpdateDoctorRequest
} from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private apiUrl = `${API_BASE_URL}/admin`;

  constructor(private http: HttpClient) {}

  listDoctors(search?: string, status?: AccountStatus): Observable<DoctorAdmin[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<DoctorAdmin[]>(`${this.apiUrl}/doctors`, { params });
  }

  createDoctor(request: CreateDoctorRequest): Observable<DoctorAdmin> {
    return this.http.post<DoctorAdmin>(`${this.apiUrl}/doctors`, request);
  }

  updateDoctor(id: string, request: UpdateDoctorRequest): Observable<DoctorAdmin> {
    return this.http.put<DoctorAdmin>(`${this.apiUrl}/doctors/${id}`, request);
  }

  setDoctorStatus(id: string, status: AccountStatus): Observable<DoctorAdmin> {
    return this.http.patch<DoctorAdmin>(`${this.apiUrl}/doctors/${id}/status`, { status });
  }

  listPatients(search?: string, status?: AccountStatus): Observable<PatientAdmin[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<PatientAdmin[]>(`${this.apiUrl}/patients`, { params });
  }

  getPatient(id: string): Observable<PatientAdmin> {
    return this.http.get<PatientAdmin>(`${this.apiUrl}/patients/${id}`);
  }

  setPatientStatus(id: string, status: AccountStatus): Observable<PatientAdmin> {
    return this.http.patch<PatientAdmin>(`${this.apiUrl}/patients/${id}/status`, { status });
  }

  setPatientReferringDoctor(id: string, referringDoctorEmail: string): Observable<PatientAdmin> {
    return this.http.patch<PatientAdmin>(`${this.apiUrl}/patients/${id}/referring-doctor`, { referringDoctorEmail });
  }
}
