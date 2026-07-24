import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeService } from '../../services/knowledge';
import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeDocument,
} from '../../models/knowledge.model';

@Component({
  standalone: true,
  selector: 'app-knowledge-base-page',
  imports: [DatePipe, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './knowledge-base.html',
  styleUrls: ['../medecin-theme.css']
})
export class KnowledgeBasePageComponent {
  private readonly knowledgeService = inject(KnowledgeService);

  protected readonly categories = KNOWLEDGE_CATEGORIES;

  protected readonly documents = signal<KnowledgeDocument[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly filter = signal<KnowledgeCategory | ''>('');

  protected title = '';
  protected description = '';
  protected category: KnowledgeCategory = 'GUIDELINE';
  protected selectedFile = signal<File | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    const cat = this.filter();
    this.knowledgeService.list(cat || undefined).subscribe({
      next: (docs) => { this.documents.set(docs); this.loading.set(false); },
      error: () => { this.error.set('Could not load documents.'); this.loading.set(false); }
    });
  }

  protected onFilterChange(value: string): void {
    this.filter.set(value as KnowledgeCategory | '');
    this.load();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  protected upload(): void {
    const file = this.selectedFile();
    if (!file || !this.title) {
      this.error.set('A title and a PDF file are required.');
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.knowledgeService.upload(file, this.title, this.category, this.description || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.title = '';
        this.description = '';
        this.selectedFile.set(null);
        this.load();
      },
      error: () => { this.error.set('Upload failed.'); this.uploading.set(false); }
    });
  }

  protected remove(doc: KnowledgeDocument): void {
    if (!confirm(`Delete "${doc.title}"? This also removes it from the RAG index.`)) return;
    this.knowledgeService.delete(doc.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Delete failed.')
    });
  }

  protected downloadUrl(id: string): string {
    return this.knowledgeService.downloadUrl(id);
  }

  protected sizeMb(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }
}
