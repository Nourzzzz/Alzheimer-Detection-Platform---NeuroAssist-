import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { KnowledgeCategory, KnowledgeDocument } from '../models/knowledge.model';

@Injectable({ providedIn: 'root' })
export class KnowledgeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_BASE_URL}/medecin/knowledge-base`;

  list(category?: KnowledgeCategory): Observable<KnowledgeDocument[]> {
    const query = category ? `?category=${category}` : '';
    return this.http.get<KnowledgeDocument[]>(`${this.apiUrl}${query}`);
  }

  upload(file: File, title: string, category: KnowledgeCategory, description?: string): Observable<KnowledgeDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<KnowledgeDocument>(`${this.apiUrl}/upload`, formData);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  downloadUrl(id: string): string {
    return `${this.apiUrl}/${id}/download`;
  }
}
