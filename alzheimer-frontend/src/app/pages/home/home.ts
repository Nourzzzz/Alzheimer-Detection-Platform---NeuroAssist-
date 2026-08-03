import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomePageComponent {
  protected readonly i18n = inject(I18nService);
}
