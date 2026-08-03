import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuestionnaireService } from '../../services/questionnaire';
import { Answer, Question, QuestionnaireResult, RiskBucket } from '../../models/questionnaire.model';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-questionnaire-page',
  imports: [RouterLink],
  templateUrl: './questionnaire.html',
  styleUrl: './questionnaire.css'
})
export class QuestionnairePageComponent implements OnInit {
  private readonly questionnaireService = inject(QuestionnaireService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(I18nService);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly questions = signal<Question[]>([]);
  protected readonly currentIndex = signal(0);
  protected readonly answers = signal<Map<string, number>>(new Map());
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly result = signal<QuestionnaireResult | null>(null);

  protected readonly currentQuestion = computed<Question | null>(() => {
    const list = this.questions();
    const index = this.currentIndex();
    return list.length > 0 ? list[index] : null;
  });

  protected readonly progressPercent = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    return Math.round(((this.currentIndex() + 1) / total) * 100);
  });

  protected readonly isLastQuestion = computed(
    () => this.currentIndex() === this.questions().length - 1
  );

  protected readonly selectedValue = computed(() => {
    const question = this.currentQuestion();
    if (!question) return null;
    return this.answers().get(question.id) ?? null;
  });

  protected readonly canProceed = computed(() => this.selectedValue() !== null);

  ngOnInit(): void {
    this.questionnaireService.getQuestions().subscribe({
      next: (questions) => {
        this.questions.set(questions);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(this.i18n.t('quiz.loadError'));
      }
    });
  }

  protected selectAnswer(value: number): void {
    const question = this.currentQuestion();
    if (!question) return;
    const next = new Map(this.answers());
    next.set(question.id, value);
    this.answers.set(next);
  }

  protected goPrevious(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((i) => i - 1);
    }
  }

  protected goNext(): void {
    if (!this.canProceed()) return;
    if (!this.isLastQuestion()) {
      this.currentIndex.update((i) => i + 1);
    }
  }

  protected submit(): void {
    if (!this.canProceed()) return;

    const answers: Answer[] = this.questions().map((q) => ({
      questionId: q.id,
      value: this.answers().get(q.id)!
    }));

    this.submitting.set(true);
    this.submitError.set(null);

    this.questionnaireService.submit({ answers }).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.result.set(result);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set(this.i18n.t('patient.quiz.legacy.submitError'));
      }
    });
  }

  protected riskLabel(bucket: RiskBucket): string {
    return this.i18n.t(`patient.quiz.risk.${bucket}`);
  }

  protected goHome(): void {
    this.router.navigate(['/home']);
  }
}
