import { Component, OnInit, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { AdminService } from '../../../services/admin';
import { AccountStatus, DoctorAdmin, PatientAdmin } from '../../../models/admin.model';

@Component({
  standalone: true,
  selector: 'app-admin-patients-page',
  imports: [RouterLink, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-patients.html',
  styleUrls: ['../admin-theme.css']
})
export class AdminPatientsPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  protected readonly patients = signal<PatientAdmin[]>([]);
  protected readonly loading = signal(true);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<AccountStatus | ''>('');
  
  protected readonly sortColumn = signal<keyof PatientAdmin | ''>('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(5);

  protected readonly filteredAndSortedPatients = computed(() => {
    let result = [...this.patients()];
    const term = this.search().toLowerCase().trim();
    if (term) {
      result = result.filter(p => 
        (p.prenom + ' ' + p.nom).toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term)
      );
    }

    const status = this.statusFilter();
    if (status) {
      result = result.filter(p => p.status === status);
    }

    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;
    if (col) {
      result.sort((a, b) => {
        const valA = (a[col] || '') as string;
        const valB = (b[col] || '') as string;
        return valA.localeCompare(valB) * dir;
      });
    }
    return result;
  });

  protected readonly totalFiltered = computed(() => this.filteredAndSortedPatients().length);
  protected readonly totalPages = computed(() => Math.ceil(this.totalFiltered() / this.pageSize()) || 1);

  protected readonly paginatedPatients = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedPatients().slice(start, start + this.pageSize());
  });

  protected setSort(column: keyof PatientAdmin): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  protected readonly selectedPatient = signal<PatientAdmin | null>(null);
  protected readonly activeDoctors = signal<DoctorAdmin[]>([]);
  protected readonly assigningDoctorEmail = signal('');

  ngOnInit(): void {
    this.load();
    this.adminService.listDoctors(undefined, 'ACTIVE').subscribe({
      next: (doctors) => this.activeDoctors.set(doctors)
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.adminService.listPatients().subscribe({
      next: (patients) => { this.patients.set(patients); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  protected viewDetails(patient: PatientAdmin): void {
    this.selectedPatient.set(patient);
    this.assigningDoctorEmail.set(patient.referringDoctorEmail ?? '');
  }

  protected assignReferringDoctor(): void {
    const patient = this.selectedPatient();
    const email = this.assigningDoctorEmail();
    if (!patient || !email) return;

    this.adminService.setPatientReferringDoctor(patient.id, email).subscribe({
      next: (updated) => {
        this.patients.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.selectedPatient.set(updated);
      }
    });
  }

  protected closeDetails(): void {
    this.selectedPatient.set(null);
  }

  protected toggleStatus(patient: PatientAdmin): void {
    const newStatus: AccountStatus = patient.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.setPatientStatus(patient.id, newStatus).subscribe({
      next: (updated) => {
        this.patients.update(list => list.map(p => p.id === updated.id ? updated : p));
        if (this.selectedPatient()?.id === updated.id) {
          this.selectedPatient.set(updated);
        }
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
