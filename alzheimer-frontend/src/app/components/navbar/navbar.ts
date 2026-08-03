import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, Role } from '../../services/auth';
import { I18nService } from '../../services/i18n';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';

interface NavItem {
  labelKey: string;
  path: string;
  visibility: 'public' | Role;
  exact?: boolean;
}

const MENU: NavItem[] = [
  { labelKey: 'nav.home', path: '/', visibility: 'public', exact: true },
  { labelKey: 'nav.about', path: '/about', visibility: 'public' },
  { labelKey: 'nav.departments', path: '/departments', visibility: 'public' },
  { labelKey: 'nav.services', path: '/services', visibility: 'public' },
  { labelKey: 'nav.doctors', path: '/doctors', visibility: 'public' },
  { labelKey: 'nav.contact', path: '/contact', visibility: 'public' },
  { labelKey: 'nav.dashboard', path: '/dashboard', visibility: 'MEDECIN' },
  { labelKey: 'nav.mySpace', path: '/home', visibility: 'PATIENT' },
  { labelKey: 'nav.questionnaire', path: '/questionnaire', visibility: 'PATIENT' },
  { labelKey: 'nav.myResults', path: '/my-results', visibility: 'PATIENT' }
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LanguageSwitcherComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  protected readonly menuItems = computed(() => {
    const role = this.auth.role();
    return MENU.filter((item) => item.visibility === 'public' || item.visibility === role);
  });

  protected readonly mobileNavActive = signal(false);
  protected readonly userMenuOpen = signal(false);

  protected toggleMobileNav(): void {
    const next = !this.mobileNavActive();
    this.mobileNavActive.set(next);
    document.body.classList.toggle('mobile-nav-active', next);
  }

  protected closeMobileNav(): void {
    if (this.mobileNavActive()) {
      this.mobileNavActive.set(false);
      document.body.classList.remove('mobile-nav-active');
    }
  }

  protected toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.userMenuOpen.update((open) => !open);
  }

  protected logout(): void {
    this.auth.logout();
    this.closeMobileNav();
    this.router.navigate(['/sign-in']);
  }
}
