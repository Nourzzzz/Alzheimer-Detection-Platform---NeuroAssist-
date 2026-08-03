import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssessmentService } from '../../services/assessment';
import { AssessmentSummary } from '../../models/mri.model';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-validation-queue-page',
  imports: [RouterLink, DatePipe, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './validation-queue.html',
  styleUrls: ['../medecin-theme.css']
})
export class ValidationQueuePageComponent {
  private readonly assessmentService = inject(AssessmentService);
  protected readonly i18n = inject(I18nService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<AssessmentSummary[]>([]);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.assessmentService.pending().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('medecin.queue.loadError'));
        this.loading.set(false);
      }
    });
  }
}
