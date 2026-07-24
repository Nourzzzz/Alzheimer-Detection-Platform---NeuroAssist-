import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, Role } from '../../services/auth';

interface NavItem {
  label: string;
  path: string;
  visibility: 'public' | Role;
  exact?: boolean;
}

const MENU: NavItem[] = [
  { label: 'Home', path: '/', visibility: 'public', exact: true },
  { label: 'About', path: '/about', visibility: 'public' },
  { label: 'Departments', path: '/departments', visibility: 'public' },
  { label: 'Services', path: '/services', visibility: 'public' },
  { label: 'Doctors', path: '/doctors', visibility: 'public' },
  { label: 'Contact', path: '/contact', visibility: 'public' },
  { label: 'Dashboard', path: '/dashboard', visibility: 'MEDECIN' },
  { label: 'My Space', path: '/home', visibility: 'PATIENT' },
  { label: 'Questionnaire', path: '/questionnaire', visibility: 'PATIENT' },
  { label: 'My Results', path: '/my-results', visibility: 'PATIENT' }
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
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
