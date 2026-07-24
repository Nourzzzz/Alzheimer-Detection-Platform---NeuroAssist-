import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  protected readonly scrollTopActive = signal(false);

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrollTopActive.set(window.scrollY > 100);
  }

  protected scrollToTop(event: Event): void {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
