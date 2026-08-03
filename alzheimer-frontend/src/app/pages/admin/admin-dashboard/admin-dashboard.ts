import { Component, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { AdminService } from '../../../services/admin';
import { I18nService } from '../../../services/i18n';
import { DoctorAdmin, PatientAdmin } from '../../../models/admin.model';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-dashboard.html',
  styleUrls: ['../admin-theme.css']
})
export class AdminDashboardPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  protected readonly doctors = signal<DoctorAdmin[]>([]);
  protected readonly patients = signal<PatientAdmin[]>([]);
  protected readonly loading = signal(true);

  protected readonly totalDoctors = computed(() => this.doctors().length);
  protected readonly activeDoctors = computed(() => this.doctors().filter(d => d.status === 'ACTIVE').length);
  protected readonly inactiveDoctors = computed(() => this.doctors().filter(d => d.status === 'INACTIVE').length);

  protected readonly totalPatients = computed(() => this.patients().length);
  protected readonly activePatients = computed(() => this.patients().filter(p => p.status === 'ACTIVE').length);
  protected readonly inactivePatients = computed(() => this.patients().filter(p => p.status === 'INACTIVE').length);

  ngOnInit(): void {
    this.adminService.listDoctors().subscribe({
      next: (doctors) => { this.doctors.set(doctors); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    this.adminService.listPatients().subscribe({
      next: (patients) => this.patients.set(patients),
      error: () => {}
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
