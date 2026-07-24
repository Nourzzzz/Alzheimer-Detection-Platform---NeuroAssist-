import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { RecentActivity } from '../models/questionnaire.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private apiUrl = `${API_BASE_URL}/medecin/dashboard`;

  constructor(private http: HttpClient) {}

  recentActivity(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent-activity`);
  }
}
