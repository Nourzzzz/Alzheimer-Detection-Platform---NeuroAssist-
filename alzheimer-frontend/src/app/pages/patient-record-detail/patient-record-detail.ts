import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient';
import { MriService } from '../../services/mri';
import { PatientDetail, UpdatePatientRequest } from '../../models/patient.model';
import { AiAssessment } from '../../models/mri.model';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';

@Component({
  standalone: true,
  selector: 'app-patient-record-detail-page',
  imports: [RouterLink, DatePipe, DecimalPipe, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './patient-record-detail.html',
  styleUrls: ['../medecin-theme.css']
})
export class PatientRecordDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly mriService = inject(MriService);

  protected readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly patient = signal<PatientDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly history = signal<AiAssessment[]>([]);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly editForm = signal<UpdatePatientRequest>({ prenom: '', nom: '' });

  protected readonly archiving = signal(false);

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.patientService.get(this.patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        this.loading.set(false);
        this.mriService.history(patient.email).subscribe({
          next: (history) => this.history.set(history),
          error: () => {}
        });
      },
      error: () => this.loading.set(false)
    });
  }

  protected startEdit(): void {
    const p = this.patient();
    if (!p) return;
    this.editForm.set({
      prenom: p.prenom,
      nom: p.nom,
      telephone: p.telephone,
      adresse: p.adresse,
      genre: p.genre,
      dateNaissance: p.dateNaissance,
      groupeSanguin: p.groupeSanguin,
      antecedentsMedicaux: p.antecedentsMedicaux
    });
    this.saveError.set(null);
    this.editing.set(true);
  }

  protected updateField(field: keyof UpdatePatientRequest, value: string): void {
    this.editForm.update((f) => ({ ...f, [field]: value }));
  }

  protected saveEdit(): void {
    this.saving.set(true);
    this.saveError.set(null);

    this.patientService.update(this.patientId, this.editForm()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.editing.set(false);
        this.patient.set(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? 'Impossible de mettre à jour ce dossier.');
      }
    });
  }

  protected toggleArchive(): void {
    const p = this.patient();
    if (!p) return;

    this.archiving.set(true);
    const action = p.status === 'ARCHIVED'
      ? this.patientService.unarchive(this.patientId)
      : this.patientService.archive(this.patientId);

    action.subscribe({
      next: (updated) => {
        this.archiving.set(false);
        this.patient.set(updated);
      },
      error: () => this.archiving.set(false)
    });
  }

  protected stageBadgeClass(stage: string | undefined): string {
    switch (stage) {
      case 'CN': return 'badge-success';
      case 'MCI': return 'badge-warning';
      case 'AD': return 'badge-danger';
      default: return 'badge-info';
    }
  }
}
