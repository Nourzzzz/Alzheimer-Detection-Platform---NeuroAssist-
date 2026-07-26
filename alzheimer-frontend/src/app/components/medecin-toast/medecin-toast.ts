import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notification';

@Component({
  standalone: true,
  selector: 'app-medecin-toast',
  template: `
    @if (visible()) {
      <div class="toast-wrap" role="status" aria-live="polite">
        <div class="toast-card">
          <span class="toast-icon"><i class="bi bi-clipboard2-check-fill"></i></span>

          <div class="toast-body">
            <strong class="toast-title">
              {{ count() }} assessment{{ count() > 1 ? 's' : '' }} awaiting validation
            </strong>
            <span class="toast-text">
              Review the AI findings before they reach your patient{{ count() > 1 ? 's' : '' }}.
            </span>
          </div>

          <div class="toast-actions">
            <button type="button" class="toast-open" (click)="openQueue()">Review</button>
            <button type="button" class="toast-close" (click)="dismiss()" aria-label="Dismiss">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .toast-wrap {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      z-index: 1080;
      pointer-events: none;
      padding: 0 16px;
      max-width: 100%;
    }

    .toast-card {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 14px;
      max-width: 560px;
      padding: 14px 16px;
      border-radius: 14px;
      background: #0f172a;
      color: #f8fafc;
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.32);
      animation: toast-in 0.28s ease-out;
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .toast-card { animation: none; }
    }

    .toast-icon {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #dc2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: #fff;
    }

    .toast-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .toast-text {
      font-size: 0.8rem;
      color: #cbd5e1;
      line-height: 1.4;
    }

    .toast-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }

    .toast-open {
      border: none;
      border-radius: 8px;
      padding: 0.45rem 0.85rem;
      background: #3b82f6;
      color: #fff;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s ease;
    }

    .toast-open:hover { background: #2563eb; }

    .toast-close {
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0.35rem;
      line-height: 1;
      border-radius: 6px;
      transition: color 0.2s ease, background 0.2s ease;
    }

    .toast-close:hover { color: #f8fafc; background: rgba(248, 250, 252, 0.1); }

    @media (max-width: 575px) {
      .toast-card { flex-wrap: wrap; }
      .toast-actions { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class MedecinToastComponent {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly count = this.notifications.pendingValidations;

  // Remembers the count the doctor last dismissed at, so the toast stays hidden
  // until a NEW assessment arrives rather than reappearing on every poll.
  private readonly dismissedAt = signal<number | null>(null);

  protected readonly visible = computed(() => {
    if (!this.auth.isMedecin()) {
      return false;
    }
    const pending = this.count();
    if (pending <= 0) {
      return false;
    }
    const dismissed = this.dismissedAt();
    return dismissed === null || pending > dismissed;
  });

  protected dismiss(): void {
    this.dismissedAt.set(this.count());
  }

  protected openQueue(): void {
    this.dismiss();
    this.router.navigate(['/dashboard'], { queryParams: { tab: 'validation' } });
  }
}
