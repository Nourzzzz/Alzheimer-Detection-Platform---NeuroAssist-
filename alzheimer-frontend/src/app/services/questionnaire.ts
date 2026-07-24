import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { Question, QuestionnaireResult, QuestionnaireSubmitRequest } from '../models/questionnaire.model';

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {

  private apiUrl = `${API_BASE_URL}/patient/questionnaire`;

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  submit(request: QuestionnaireSubmitRequest): Observable<QuestionnaireResult> {
    return this.http.post<QuestionnaireResult>(`${this.apiUrl}/submit`, request);
  }

  history(): Observable<QuestionnaireResult[]> {
    return this.http.get<QuestionnaireResult[]>(`${this.apiUrl}/history`);
  }
}
