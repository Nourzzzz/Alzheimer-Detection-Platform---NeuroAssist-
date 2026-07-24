import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AssessmentService } from '../../services/assessment';
import { PatientAssessmentView } from '../../models/mri.model';

@Component({
  standalone: true,
  selector: 'app-my-results-page',
  imports: [DatePipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './my-results.html',
  styleUrls: ['../patient-home/patient-home.css']
})
export class MyResultsPageComponent {
  private readonly assessmentService = inject(AssessmentService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<PatientAssessmentView[]>([]);

  constructor() {
    this.assessmentService.myResults().subscribe({
      next: (results) => { this.results.set(results); this.loading.set(false); },
      error: () => { this.error.set('Could not load your results.'); this.loading.set(false); }
    });
  }
}
