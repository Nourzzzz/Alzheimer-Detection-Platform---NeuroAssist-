import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CognitiveQuestionnaireService } from '../../services/cognitive';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-patient-home-page',
  imports: [RouterLink],
  templateUrl: './patient-home.html',
  styleUrl: './patient-home.css'
})
export class PatientHomePageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly cognitiveService = inject(CognitiveQuestionnaireService);

  protected readonly loading = signal(true);

  protected readonly hasCompletedAssessment = signal(false);

  ngOnInit(): void {
    this.cognitiveService.latestForMe().subscribe({
      next: (summary) => {
        this.hasCompletedAssessment.set(summary.exists);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
