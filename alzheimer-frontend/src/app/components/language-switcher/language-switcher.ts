import { Component, inject } from '@angular/core';
import { I18nService, Lang } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-language-switcher',
  template: `
    <div class="lang-switch" role="group" [attr.aria-label]="i18n.t('nav.language')">
      @for (code of i18n.languages; track code) {
        <button
          type="button"
          class="lang-option"
          [class.active]="i18n.lang() === code"
          [attr.aria-pressed]="i18n.lang() === code"
          [title]="i18n.labels[code]"
          (click)="select(code)">
          {{ code.toUpperCase() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 999px;
      background: var(--surface-color, #fff);
    }

    .lang-option {
      border: none;
      background: transparent;
      color: var(--text-muted, #64748b);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }

    .lang-option:hover { color: var(--accent-color, #3b82f6); }

    .lang-option.active {
      background: var(--accent-color, #3b82f6);
      color: #fff;
    }
  `]
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(I18nService);

  protected select(lang: Lang): void {
    this.i18n.setLang(lang);
  }
}
