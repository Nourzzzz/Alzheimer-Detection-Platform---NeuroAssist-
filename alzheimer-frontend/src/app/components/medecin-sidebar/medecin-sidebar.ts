import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../services/notification';
import { SidebarService } from '../../services/sidebar';
import { I18nService } from '../../services/i18n';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';

interface SidebarItem {
  labelKey: string;
  icon: string;
  path: string;
  queryParams?: Record<string, string>;
  prefixMatch?: boolean;
  badge?: 'pendingValidations';
}

const MAIN_ITEMS: SidebarItem[] = [
  { labelKey: 'sidebar.dashboard', icon: 'bi-grid-1x2-fill', path: '/dashboard', queryParams: {} },
  { labelKey: 'sidebar.patients', icon: 'bi-folder2-open', path: '/patients', prefixMatch: true },
  { labelKey: 'sidebar.validation', icon: 'bi-clipboard2-check-fill', path: '/dashboard', queryParams: { tab: 'validation' }, badge: 'pendingValidations' },
  { labelKey: 'sidebar.knowledgeBase', icon: 'bi-journal-medical', path: '/dashboard', queryParams: { tab: 'knowledge-base' } },
];

@Component({
  standalone: true,
  selector: 'app-medecin-sidebar',
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './medecin-sidebar.html',
  styleUrls: ['../../pages/medecin-theme.css']
})
export class MedecinSidebarComponent {
  protected readonly mainItems = MAIN_ITEMS;
  protected readonly notifications = inject(NotificationService);
  protected readonly sidebar = inject(SidebarService);
  protected readonly i18n = inject(I18nService);
}
