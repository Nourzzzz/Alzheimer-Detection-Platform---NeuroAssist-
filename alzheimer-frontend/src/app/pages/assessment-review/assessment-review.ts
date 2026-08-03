import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssessmentService } from '../../services/assessment';
import { AuthService } from '../../services/auth';
import { CognitiveQuestionnaireService } from '../../services/cognitive';
import { AssessmentDetail, AlzheimerStage, ValidationAction } from '../../models/mri.model';
import { CognitiveLatestSummary } from '../../models/cognitive.model';
import { TextBlock, parseStructuredText, splitDraftBanner } from '../../utils/rich-text';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-assessment-review-page',
  imports: [RouterLink, DatePipe, DecimalPipe, FormsModule, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './assessment-review.html',
  styleUrls: ['../medecin-theme.css']
})
export class AssessmentReviewPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentService = inject(AssessmentService);
  private readonly cognitiveService = inject(CognitiveQuestionnaireService);
  protected readonly i18n = inject(I18nService);

  protected readonly stages: AlzheimerStage[] = ['CN', 'MCI', 'AD'];

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly detail = signal<AssessmentDetail | null>(null);
  protected readonly gradcamUrl = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected readonly cognitiveLoading = signal(true);
  protected readonly cognitiveSummary = signal<CognitiveLatestSummary | null>(null);
  protected readonly showFullTranscript = signal(false);

  protected comment = '';
  protected correctedStage: AlzheimerStage = 'CN';
  protected editedReport = '';
  protected patientGuidance = '';

  protected readonly showRevisions = signal(false);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  private load(id: string): void {
    this.loading.set(true);
    this.assessmentService.detail(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.editedReport = detail.editedReport ?? detail.generatedReport ?? '';
        this.patientGuidance = detail.editedGuidance ?? detail.patientGuidance ?? '';
        this.correctedStage = detail.stage;
        this.loading.set(false);
        if (detail.hasGradCam) {
          this.assessmentService.gradcamBlob(detail.id).subscribe({
            next: (blob) => this.gradcamUrl.set(URL.createObjectURL(blob)),
            error: () => {}
          });
        }
        this.loadCognitiveSummary(detail.patientEmail);
      },
      error: () => {
        this.error.set(this.i18n.t('review.loadError'));
        this.loading.set(false);
      }
    });
  }

  private loadCognitiveSummary(patientEmail: string): void {
    this.cognitiveLoading.set(true);
    this.cognitiveService.latestForPatient(patientEmail).subscribe({
      next: (summary) => {
        this.cognitiveSummary.set(summary.exists ? summary : null);
        this.cognitiveLoading.set(false);
      },
      error: () => this.cognitiveLoading.set(false)
    });
  }

  protected toggleTranscript(): void {
    this.showFullTranscript.update((v) => !v);
  }

  protected scaleEntries(): { key: string; label: string; score: number; max: number; aboveCutoff: boolean }[] {
    const scores = this.cognitiveSummary()?.scores;
    if (!scores) return [];
    return Object.entries(scores).map(([key, scale]) => ({
      key,
      label: scale.label,
      score: scale.score,
      max: scale.max,
      aboveCutoff: scale.flag === 'above_cutoff'
    }));
  }

  protected probabilityEntries(): { label: string; value: number }[] {
    const probs = this.detail()?.cnnResult?.probabilities;
    if (!probs) return [];
    return Object.entries(probs).map(([label, value]) => ({ label, value: value as number }));
  }

  protected reportBanner(raw: string | null): string | null {
    return splitDraftBanner(raw).banner;
  }

  protected reportBlocks(raw: string | null): TextBlock[] {
    return parseStructuredText(splitDraftBanner(raw).body);
  }

  protected canRequestRevision(): boolean {
    return (this.detail()?.revisionsRemaining ?? 0) > 0;
  }

  protected toggleRevisions(): void {
    this.showRevisions.update((v) => !v);
  }

  protected submit(action: ValidationAction): void {
    const current = this.detail();
    if (!current) return;

    // The AI can only answer an objection it has been told about.
    if (action === 'REQUEST_REVISION' && !this.comment.trim()) {
      this.error.set(this.i18n.t('review.revision.needComment'));
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.assessmentService.validate(current.id, {
      action,
      comment: this.comment || undefined,
      correctedStage: action === 'CORRECT' ? this.correctedStage : undefined,
      editedReport: action === 'REQUEST_REVISION' ? undefined : (this.editedReport || undefined),
      patientGuidance: this.patientGuidance || undefined,
    }).subscribe({
      next: (updated) => {
        this.detail.set(updated);
        if (action === 'REQUEST_REVISION') {
          // The regenerated draft replaces what was in the editor.
          this.editedReport = updated.editedReport ?? updated.generatedReport ?? '';
          this.patientGuidance = updated.editedGuidance ?? updated.patientGuidance ?? '';
          this.comment = '';
        }
        this.submitting.set(false);
      },
      error: () => {
        this.error.set(this.i18n.t('review.decision.failed'));
        this.submitting.set(false);
      }
    });
  }

  protected backToQueue(): void {
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'validation' } });
  }
}
