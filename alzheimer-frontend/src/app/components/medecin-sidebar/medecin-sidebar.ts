import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../services/notification';

interface SidebarItem {
  label: string;
  icon: string;
  path: string;
  queryParams?: Record<string, string>;
  prefixMatch?: boolean;
  badge?: 'pendingValidations';
}

const MAIN_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', icon: 'bi-grid-1x2-fill', path: '/dashboard', queryParams: {} },
  { label: 'Patient Records', icon: 'bi-folder2-open', path: '/patients', prefixMatch: true },
  { label: 'Validation', icon: 'bi-clipboard2-check-fill', path: '/dashboard', queryParams: { tab: 'validation' }, badge: 'pendingValidations' },
  { label: 'Knowledge Base', icon: 'bi-journal-medical', path: '/dashboard', queryParams: { tab: 'knowledge-base' } },
];

@Component({
  standalone: true,
  selector: 'app-medecin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './medecin-sidebar.html',
  styleUrls: ['../../pages/medecin-theme.css']
})
export class MedecinSidebarComponent {
  protected readonly mainItems = MAIN_ITEMS;
  protected readonly notifications = inject(NotificationService);
}
