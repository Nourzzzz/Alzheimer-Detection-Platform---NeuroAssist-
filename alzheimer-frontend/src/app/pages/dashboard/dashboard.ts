import { Component, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PatientService } from '../../services/patient';
import { DashboardService } from '../../services/dashboard';
import { PatientResponse } from '../../models/patient.model';
import { RecentActivity, RiskBucket } from '../../models/questionnaire.model';
import { ValidationQueuePageComponent } from '../validation-queue/validation-queue';
import { KnowledgeBasePageComponent } from '../knowledge-base/knowledge-base';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';
import { I18nService } from '../../services/i18n';

interface PatientRow extends PatientResponse {
  age: number;
  latestActivity: RecentActivity | null;
}

type DashboardTab = 'overview' | 'validation' | 'knowledge-base';

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink, DatePipe, ValidationQueuePageComponent, KnowledgeBasePageComponent, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardPageComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly patientService = inject(PatientService);
  private readonly dashboardService = inject(DashboardService);
  private readonly route = inject(ActivatedRoute);
  protected readonly i18n = inject(I18nService);

  protected readonly activeTab = signal<DashboardTab>('overview');

  protected readonly patients = signal<PatientResponse[]>([]);
  protected readonly activity = signal<RecentActivity[]>([]);
  protected readonly loading = signal(true);

  protected readonly searchTerm = signal('');
  protected readonly sortColumn = signal<keyof PatientRow | ''>('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(5);

  protected readonly baseRows = computed<PatientRow[]>(() => {
    const activityByName = new Map<string, RecentActivity>();
    for (const item of this.activity()) {
      if (!activityByName.has(item.patientName)) {
        activityByName.set(item.patientName, item);
      }
    }

    return this.patients().map((patient) => ({
      ...patient,
      age: this.computeAge(patient.dateOfBirth),
      latestActivity: activityByName.get(`${patient.firstName} ${patient.lastName}`) ?? null
    }));
  });

  protected readonly filteredAndSortedRows = computed(() => {
    let result = [...this.baseRows()];
    const term = this.searchTerm().toLowerCase().trim();
    
    if (term) {
      result = result.filter(r => 
        r.firstName.toLowerCase().includes(term) ||
        r.lastName.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    }

    const col = this.sortColumn();
    const dir = this.sortDirection() === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      if (col === 'firstName') {
        const nameA = a.firstName + ' ' + a.lastName;
        const nameB = b.firstName + ' ' + b.lastName;
        return nameA.localeCompare(nameB) * dir;
      } else if (col === 'age') {
        return (a.age - b.age) * dir;
      } else if (col === 'gender') {
        return a.gender.localeCompare(b.gender) * dir;
      } else if (col === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  });

  protected readonly totalFilteredRows = computed(() => this.filteredAndSortedRows().length);
  protected readonly totalPages = computed(() => Math.ceil(this.totalFilteredRows() / this.pageSize()) || 1);

  protected readonly paginatedRows = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredAndSortedRows().slice(start, start + this.pageSize());
  });

  protected readonly totalPatients = computed(() => this.patients().length);

  protected readonly assessedCount = computed(
    () => this.baseRows().filter((row) => row.latestActivity !== null).length
  );

  protected readonly furtherEvaluationCount = computed(
    () => this.baseRows().filter((row) => row.latestActivity?.riskBucket === 'Further Evaluation Recommended').length
  );

  protected readonly newThisMonthCount = computed(() => {
    const now = new Date();
    return this.patients().filter((patient) => {
      const created = new Date(patient.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length;
  });

  protected readonly riskDistribution = computed(() => {
    const buckets: Record<RiskBucket, number> = {
      Low: 0,
      Moderate: 0,
      'Further Evaluation Recommended': 0
    };
    for (const row of this.baseRows()) {
      if (row.latestActivity) {
        buckets[row.latestActivity.riskBucket]++;
      }
    }
    return buckets;
  });

  ngOnInit(): void {
    this.patientService.listMine().subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.dashboardService.recentActivity().subscribe({
      next: (activity) => this.activity.set(activity),
      error: () => {}
    });

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab === 'validation' || tab === 'knowledge-base') {
        this.activeTab.set(tab);
      } else {
        this.activeTab.set('overview');
      }
    });
  }

  protected setSort(column: keyof PatientRow): void {
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

  protected riskBadgeClass(bucket: RiskBucket | undefined | null): string {
    switch (bucket) {
      case 'Low':
        return 'badge-success';
      case 'Moderate':
        return 'badge-warning';
      case 'Further Evaluation Recommended':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  }

  protected riskLabel(bucket: RiskBucket | undefined | null): string {
    switch (bucket) {
      case 'Low':
        return this.i18n.t('medecin.risk.low');
      case 'Moderate':
        return this.i18n.t('medecin.risk.moderate');
      case 'Further Evaluation Recommended':
        return this.i18n.t('medecin.risk.further');
      default:
        return '';
    }
  }

  protected timeAgo(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return this.i18n.t('medecin.time.justNow');
    if (minutes < 60) return this.i18n.t('medecin.time.minutes', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return this.i18n.t('medecin.time.hours', { n: hours });
    const days = Math.floor(hours / 24);
    return this.i18n.t('medecin.time.days', { n: days });
  }

  private computeAge(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
}
