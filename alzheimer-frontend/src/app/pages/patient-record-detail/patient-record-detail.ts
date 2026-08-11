import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PatientService } from '../../services/patient';
import { MriService } from '../../services/mri';
import { ConsultationService } from '../../services/consultation';
import { PatientDetail, UpdatePatientRequest } from '../../models/patient.model';
import { AiAssessment } from '../../models/mri.model';
import {
  Consultation,
  ConsultationAssessment,
  ConsultationRequest,
} from '../../models/consultation.model';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';
import { I18nService } from '../../services/i18n';

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
  private readonly consultationService = inject(ConsultationService);
  protected readonly i18n = inject(I18nService);

  protected readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly patient = signal<PatientDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly history = signal<AiAssessment[]>([]);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly editForm = signal<UpdatePatientRequest>({ prenom: '', nom: '' });

  protected readonly archiving = signal(false);

  protected readonly visits = signal<Consultation[]>([]);
  protected readonly unfiled = signal<ConsultationAssessment[]>([]);
  protected readonly composingVisit = signal(false);
  protected readonly savingVisit = signal(false);
  protected readonly visitError = signal<string | null>(null);
  protected readonly visitDate = signal('');
  protected readonly visitForm = signal<ConsultationRequest>({ reason: '' });

  ngOnInit(): void {
    this.reload();
  }

  private loadVisits(email: string): void {
    this.consultationService.timeline(email).subscribe({
      next: (visits) => this.visits.set(visits),
      error: () => {}
    });
    this.consultationService.unfiled(email).subscribe({
      next: (list) => this.unfiled.set(list),
      error: () => {}
    });
  }

  protected startVisit(): void {
    this.visitForm.set({ reason: '' });
    this.visitDate.set(new Date().toISOString().slice(0, 10));
    this.visitError.set(null);
    this.composingVisit.set(true);
  }

  protected updateVisit(field: keyof ConsultationRequest, value: string): void {
    this.visitForm.update((f) => ({ ...f, [field]: value }));
  }

  protected saveVisit(): void {
    const patient = this.patient();
    if (!patient) return;

    const form = this.visitForm();
    const blankToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
    const day = this.visitDate();

    this.savingVisit.set(true);
    this.visitError.set(null);
    this.consultationService.create(patient.email, {
      reason: form.reason.trim(),
      // The visit date carries no time of day; midnight keeps it a plain date.
      occurredAt: day ? `${day}T00:00:00` : undefined,
      symptoms: blankToNull(form.symptoms),
      medicalHistory: blankToNull(form.medicalHistory),
      treatments: blankToNull(form.treatments),
      observations: blankToNull(form.observations)
    }).subscribe({
      next: () => {
        this.savingVisit.set(false);
        this.composingVisit.set(false);
        this.loadVisits(patient.email);
      },
      error: (err) => {
        this.savingVisit.set(false);
        this.visitError.set(err?.error?.message ?? this.i18n.t('medecin.visits.saveFailed'));
      }
    });
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
        this.loadVisits(patient.email);
      },
      error: () => this.loading.set(false)
    });
  }

  /**
   * A date of birth carries no time. Older records come back as a full
   * timestamp ("1950-04-25T00:00:00"), which is neither what `<input type=date>`
   * accepts nor what the update endpoint can parse, so keep only the date part.
   */
  private toDateOnly(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    return match ? match[1] : undefined;
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
      dateNaissance: this.toDateOnly(p.dateNaissance),
      groupeSanguin: p.groupeSanguin,
      antecedentsMedicaux: p.antecedentsMedicaux,
      contactUrgenceNom: p.contactUrgenceNom,
      contactUrgenceEmail: p.contactUrgenceEmail,
      contactUrgenceLien: p.contactUrgenceLien
    });
    this.saveError.set(null);
    this.editing.set(true);
  }

  protected updateField(field: keyof UpdatePatientRequest, value: string): void {
    this.editForm.update((f) => ({ ...f, [field]: value }));
  }

  /** Blanked optional fields must travel as null: an empty string is not a
   *  parseable date and the server would reject the whole update. */
  private cleaned(): UpdatePatientRequest {
    const f = this.editForm();
    const blankToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
    return {
      prenom: f.prenom.trim(),
      nom: f.nom.trim(),
      telephone: blankToNull(f.telephone),
      adresse: blankToNull(f.adresse),
      genre: blankToNull(f.genre),
      dateNaissance: this.toDateOnly(f.dateNaissance),
      groupeSanguin: blankToNull(f.groupeSanguin),
      antecedentsMedicaux: blankToNull(f.antecedentsMedicaux),
      contactUrgenceNom: blankToNull(f.contactUrgenceNom),
      contactUrgenceEmail: blankToNull(f.contactUrgenceEmail),
      contactUrgenceLien: blankToNull(f.contactUrgenceLien)
    };
  }

  protected saveEdit(): void {
    this.saving.set(true);
    this.saveError.set(null);

    this.patientService.update(this.patientId, this.cleaned()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.editing.set(false);
        this.patient.set(updated);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.error?.message ?? this.i18n.t('medecin.record.error.updateFailed'));
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
