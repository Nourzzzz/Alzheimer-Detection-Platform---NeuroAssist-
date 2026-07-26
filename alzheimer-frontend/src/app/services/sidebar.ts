import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'medecinSidebarCollapsed';
const BODY_CLASS = 'sidebar-collapsed';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(localStorage.getItem(STORAGE_KEY) === 'true');

  constructor() {
    // The shell's fixed topbar and main area are laid out with hardcoded left
    // offsets in medecin-theme.css, so the collapsed state is published as a
    // body class the stylesheet can react to globally.
    effect(() => {
      const collapsed = this.collapsed();
      document.body.classList.toggle(BODY_CLASS, collapsed);
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    });
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }
}
