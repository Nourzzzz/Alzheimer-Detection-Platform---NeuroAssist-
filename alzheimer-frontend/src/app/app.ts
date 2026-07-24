import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';

declare const AOS: { init: (options?: Record<string, unknown>) => void } | undefined;
declare const GLightbox: ((options?: Record<string, unknown>) => unknown) | undefined;
declare const PureCounter: (new () => unknown) | undefined;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app-shell.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  protected showSiteChrome = true;
  private listenersBound = false;

  constructor() {
    this.updateLayout(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateLayout(event.urlAfterRedirects);
        queueMicrotask(() => {
          this.initTemplateBehaviors();
          window.scrollTo({ top: 0, behavior: 'auto' });
        });
      });

    queueMicrotask(() => {
      this.initTemplateBehaviors();
    });
  }

  private initTemplateBehaviors(): void {
    if (!this.listenersBound) {
      this.toggleScrolled();
      window.addEventListener('scroll', this.toggleScrolled, { passive: true });
      this.listenersBound = true;
    }

    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true,
        mirror: false
      });
    }

    if (typeof GLightbox !== 'undefined') {
      GLightbox({
        selector: '.glightbox'
      });
    }

    if (typeof PureCounter !== 'undefined') {
      new PureCounter();
    }
  }

  private static readonly CHROME_FREE_ROUTES = ['/sign-in', '/register', '/dashboard', '/questionnaire', '/admin'];

  private updateLayout(url: string): void {
    this.showSiteChrome = !App.CHROME_FREE_ROUTES.some((route) => url.startsWith(route));
  }

  private readonly toggleScrolled = (): void => {
    const header = document.querySelector('#header');
    if (!header) {
      return;
    }

    if (
      !header.classList.contains('scroll-up-sticky') &&
      !header.classList.contains('sticky-top') &&
      !header.classList.contains('fixed-top')
    ) {
      return;
    }

    if (window.scrollY > 100) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  };
}
