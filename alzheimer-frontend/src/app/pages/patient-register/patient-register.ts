import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, DoctorOption, RegisterRequest } from '../../services/auth';

@Component({
  standalone: true,
  selector: 'app-patient-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './patient-register.html',
  styleUrl: './patient-register.css'
})
export class PatientRegisterPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly doctors = signal<DoctorOption[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    telephone: ['', [Validators.required]],
    dateNaissance: ['', [Validators.required]],
    genre: ['', [Validators.required]],
    referringDoctorEmail: ['']
  });

  ngOnInit(): void {
    this.authService.listDoctorOptions().subscribe({
      next: (doctors) => this.doctors.set(doctors),
      error: () => {}
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const request: RegisterRequest = {
      prenom: raw.prenom,
      nom: raw.nom,
      email: raw.email,
      password: raw.password,
      role: 'PATIENT',
      telephone: raw.telephone,
      dateNaissance: raw.dateNaissance,
      genre: raw.genre,
      referringDoctorEmail: raw.referringDoctorEmail || undefined
    };

    this.authService.register(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.message || 'An error occurred while creating your account.');
      }
    });
  }
}
