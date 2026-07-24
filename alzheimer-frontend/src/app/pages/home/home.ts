import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home-page',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomePageComponent {}
