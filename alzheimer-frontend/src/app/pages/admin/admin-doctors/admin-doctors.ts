import { Component, OnInit, ViewEncapsulation, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { AdminService } from '../../../services/admin';
import { AccountStatus, CreateDoctorRequest, DoctorAdmin, UpdateDoctorRequest } from '../../../models/admin.model';

type FormMode = 'none' | 'create' | 'edit';

@Component({
  standalone: true,
  selector: 'app-admin-doctors-page',
  imports: [RouterLink, FormsModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './admin-doctors.html',
  styleUrls: ['../admin-theme.css']
})
export class AdminDoctorsPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  protected readonly doctors = signal<DoctorAdmin[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  protected readonly search = signal('');
  protected readonly statusFilter = signal<AccountStatus | ''>('');
  
  protected readonly sortColumn = signal<keyof DoctorAdmin | ''>('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(5);

  protected readonly filteredAndSortedDoctors = computed(() => {
    let result = [...this.doctors()];
    const term = this.search().toLowerCase().trim();
    if (term) {
      result = result.filter(d => 
        (d.prenom + ' ' + d.nom).toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term) ||
        (d.specialite && d.specialite.toLowerCase().includes(term))
      );
    }

    const status = this.statusFilter();
    if (status) {
      result = result.filter(d => d.status === status);
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

  protected readonly totalFiltered = computed(() => this.filteredAndSortedDoctors().length);
  protected readonly totalPages = computed(() => Math.ceil(this.totalFiltered() / this.pageSize()) || 1);

  protected readonly paginatedDoctors = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedDoctors().slice(start, start + this.pageSize());
  });

  protected setSort(column: keyof DoctorAdmin): void {
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


  protected readonly formMode = signal<FormMode>('none');
  protected readonly editingId = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly createForm = signal<CreateDoctorRequest>(this.emptyCreateForm());
  protected readonly editForm = signal<UpdateDoctorRequest>(this.emptyEditForm());

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.adminService.listDoctors().subscribe({
      next: (doctors) => { this.doctors.set(doctors); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  protected openCreateForm(): void {
    this.createForm.set(this.emptyCreateForm());
    this.errorMessage.set('');
    this.formMode.set('create');
  }

  protected openEditForm(doctor: DoctorAdmin): void {
    this.editingId.set(doctor.id);
    this.editForm.set({
      prenom: doctor.prenom,
      nom: doctor.nom,
      telephone: doctor.telephone ?? '',
      specialite: doctor.specialite ?? '',
      numeroOrdre: doctor.numeroOrdre ?? '',
      etablissement: doctor.etablissement ?? ''
    });
    this.errorMessage.set('');
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    this.formMode.set('none');
    this.editingId.set(null);
  }

  protected submitCreate(): void {
    this.saving.set(true);
    this.errorMessage.set('');
    this.adminService.createDoctor(this.createForm()).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || "Error creating doctor account");
      }
    });
  }

  protected submitEdit(): void {
    const id = this.editingId();
    if (!id) return;

    this.saving.set(true);
    this.errorMessage.set('');
    this.adminService.updateDoctor(id, this.editForm()).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || "Error updating doctor");
      }
    });
  }

  protected toggleStatus(doctor: DoctorAdmin): void {
    const newStatus: AccountStatus = doctor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.adminService.setDoctorStatus(doctor.id, newStatus).subscribe({
      next: (updated) => {
        this.doctors.update(list => list.map(d => d.id === updated.id ? updated : d));
      }
    });
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }

  private emptyCreateForm(): CreateDoctorRequest {
    return { prenom: '', nom: '', email: '', telephone: '', specialite: '', password: '' };
  }

  private emptyEditForm(): UpdateDoctorRequest {
    return { prenom: '', nom: '', telephone: '', specialite: '', numeroOrdre: '', etablissement: '' };
  }
}
