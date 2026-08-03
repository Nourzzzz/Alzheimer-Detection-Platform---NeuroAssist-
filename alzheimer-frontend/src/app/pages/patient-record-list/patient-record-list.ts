import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient';
import { ClinicalRecordService } from '../../services/clinical-record';
import { CreatePatientRequest, PatientResponse } from '../../models/patient.model';
import { ClinicalRecordRequest } from '../../models/clinical.model';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';
import { I18nService } from '../../services/i18n';

@Component({
  standalone: true,
  selector: 'app-patient-record-list-page',
  imports: [RouterLink, DatePipe, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './patient-record-list.html',
  styleUrls: ['../medecin-theme.css']
})
export class PatientRecordListPageComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly clinicalRecordService = inject(ClinicalRecordService);
  protected readonly i18n = inject(I18nService);

  protected readonly patients = signal<PatientResponse[]>([]);
  protected readonly loading = signal(true);
  protected readonly searchTerm = signal('');
  protected readonly includeArchived = signal(false);

  protected readonly showCreateForm = signal(false);
  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly newPatient = signal<CreatePatientRequest>({ prenom: '', nom: '', email: '' });
  protected readonly newRecord = signal<ClinicalRecordRequest>({
    symptoms: '', medicalHistory: '', treatments: '', observations: '', cognitiveScores: ''
  });

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.patientService.listMine(this.searchTerm() || undefined, this.includeArchived()).subscribe({
      next: (patients) => {
        this.patients.set(patients);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  protected onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.reload();
  }

  protected onIncludeArchivedChange(value: boolean): void {
    this.includeArchived.set(value);
    this.reload();
  }

  protected toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    this.createError.set(null);
  }

  protected updateNewPatientField(field: keyof CreatePatientRequest, value: string): void {
    this.newPatient.update((p) => ({ ...p, [field]: value }));
  }

  protected updateNewRecordField(field: keyof ClinicalRecordRequest, value: string): void {
    this.newRecord.update((r) => ({ ...r, [field]: value }));
  }

  private clinicalComplete(r: ClinicalRecordRequest): boolean {
    return !!(r.symptoms && r.medicalHistory && r.treatments && r.observations);
  }

  protected submitCreate(): void {
    const request = this.newPatient();
    const rec = this.newRecord();
    if (!request.prenom || !request.nom || !request.email || !this.clinicalComplete(rec)) {
      this.createError.set(this.i18n.t('medecin.patients.error.required'));
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.patientService.create(request).subscribe({
      next: () => {
        this.clinicalRecordService.save(request.email, rec).subscribe({
          next: () => {
            this.creating.set(false);
            this.showCreateForm.set(false);
            this.newPatient.set({ prenom: '', nom: '', email: '' });
            this.newRecord.set({ symptoms: '', medicalHistory: '', treatments: '', observations: '', cognitiveScores: '' });
            this.reload();
          },
          error: () => {
            this.creating.set(false);
            this.createError.set(this.i18n.t('medecin.patients.error.clinicalSaveFailed'));
            this.reload();
          }
        });
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message ?? this.i18n.t('medecin.patients.error.createFailed'));
      }
    });
  }
}
