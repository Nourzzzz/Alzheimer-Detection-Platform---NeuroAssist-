import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CognitiveQuestionnaireService } from '../../services/cognitive';
import { CognitiveOption, CognitiveQuestion, CognitiveTurn } from '../../models/cognitive.model';

@Component({
  standalone: true,
  selector: 'app-cognitive-questionnaire-page',
  imports: [RouterLink],
  templateUrl: './cognitive-questionnaire.html',
  styleUrl: '../questionnaire/questionnaire.css'
})
export class CognitiveQuestionnairePageComponent {
  private readonly cognitiveService = inject(CognitiveQuestionnaireService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly sessionId = signal<string | null>(null);
  protected readonly currentQuestion = signal<CognitiveQuestion | null>(null);
  protected readonly finished = signal(false);
  protected readonly freeText = signal('');

  protected readonly answeredCount = signal(0);

  protected readonly canSubmitFreeText = computed(() => this.freeText().trim().length > 0);

  constructor() {
    this.start();
  }

  private start(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.cognitiveService.start().subscribe({
      next: (turn) => {
        this.loading.set(false);
        this.applyTurn(turn);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set("Impossible de charger le questionnaire pour le moment.");
      }
    });
  }

  private applyTurn(turn: CognitiveTurn): void {
    this.submitting.set(false);
    this.submitError.set(null);
    this.sessionId.set(turn.sessionId);
    this.finished.set(turn.finished);
    this.currentQuestion.set(turn.question);
    this.freeText.set('');
  }

  protected selectOption(option: CognitiveOption): void {
    this.submitAnswer(option.label);
  }

  protected submitFreeText(): void {
    const text = this.freeText().trim();
    if (!text) return;
    this.submitAnswer(text);
  }

  private submitAnswer(text: string): void {
    const sessionId = this.sessionId();
    if (!sessionId || this.submitting()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    this.cognitiveService.answer(sessionId, text).subscribe({
      next: (turn) => {
        this.answeredCount.update((n) => n + 1);
        this.applyTurn(turn);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set("Une erreur est survenue lors de l'envoi de votre réponse. Veuillez réessayer.");
      }
    });
  }

  protected goHome(): void {
    this.router.navigate(['/home']);
  }
}
