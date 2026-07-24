import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CognitiveQuestionnaireService } from '../../services/cognitive';
import { CognitiveLatestSummary } from '../../models/cognitive.model';

@Component({
  standalone: true,
  selector: 'app-patient-home-page',
  imports: [RouterLink],
  templateUrl: './patient-home.html',
  styleUrl: './patient-home.css'
})
export class PatientHomePageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly cognitiveService = inject(CognitiveQuestionnaireService);

  protected readonly loading = signal(true);
  protected readonly latestResult = signal<CognitiveLatestSummary | null>(null);

  protected readonly hasCompletedAssessment = signal(false);

  ngOnInit(): void {
    this.cognitiveService.latestForMe().subscribe({
      next: (summary) => {
        this.hasCompletedAssessment.set(summary.exists);
        this.latestResult.set(summary.exists ? summary : null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  protected riskClass(level: string | undefined): string {
    switch (level) {
      case 'low':
        return 'risk-low';
      case 'moderate':
        return 'risk-moderate';
      case 'high':
        return 'risk-further';
      default:
        return '';
    }
  }
}
