import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { DatePipe } from '@angular/common';
import { AssessmentService } from '../../services/assessment';
import { AlzheimerStage, PatientAssessmentView, ValidationStatus } from '../../models/mri.model';
import { TextBlock, parseStructuredText } from '../../utils/rich-text';
import { I18nService } from '../../services/i18n';
import {
  PatientResource,
  RESOURCE_ICONS,
  ResourceKind,
  resourcesForStage,
} from '../../data/patient-resources';

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
  protected readonly i18n = inject(I18nService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly results = signal<PatientAssessmentView[]>([]);

  constructor() {
    // The guidance text is chosen server-side from Accept-Language, so switching
    // language has to refetch: re-rendering alone would keep showing the text
    // that was downloaded in the previous language.
    toObservable(this.i18n.lang)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.assessmentService.myResults().pipe(
            catchError(() => {
              this.error.set(this.i18n.t('results.error'));
              return of([] as PatientAssessmentView[]);
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((results) => {
        this.results.set(results);
        this.loading.set(false);
      });
  }

  protected guidanceBlocks(raw: string | null): TextBlock[] {
    return parseStructuredText(raw);
  }

  protected toneFor(stage: AlzheimerStage | null): string {
    switch (stage) {
      case 'CN': return 'tone-calm';
      case 'MCI': return 'tone-attention';
      case 'AD': return 'tone-priority';
      default: return 'tone-neutral';
    }
  }

  protected headlineFor(stage: AlzheimerStage | null): string {
    switch (stage) {
      case 'CN': return this.i18n.t('results.guidance.calm');
      case 'MCI': return this.i18n.t('results.guidance.attention');
      case 'AD': return this.i18n.t('results.guidance.priority');
      default: return this.i18n.t('results.guidance.default');
    }
  }

  protected statusLabel(status: ValidationStatus): string {
    return this.i18n.t(`patient.results.status.${status}`);
  }

  /** Built here rather than server-side, so it follows the language switch. */
  protected statusMessage(status: ValidationStatus): string {
    return this.i18n.t(`patient.results.message.${status}`);
  }

  /** True when only the other language was reviewed by a doctor, so the
   *  guidance is served in that language rather than the one on screen. */
  protected guidanceInOtherLang(r: PatientAssessmentView): boolean {
    return !!r.guidance && !!r.guidanceLang && r.guidanceLang !== this.i18n.lang();
  }

  /** Spells the clinical code out: a patient should not have to decode "MCI". */
  protected stageLabel(stage: AlzheimerStage | null): string {
    return stage ? this.i18n.t(`results.stage.${stage}`) : '';
  }

  protected resourcesFor(stage: AlzheimerStage | null): PatientResource[] {
    return resourcesForStage(stage);
  }

  protected iconFor(kind: ResourceKind): string {
    return RESOURCE_ICONS[kind];
  }
}
