import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { MriService } from '../../services/mri';
import { ClinicalRecordService } from '../../services/clinical-record';
import { AiAssessment } from '../../models/mri.model';
import { ClinicalDataRequired, ClinicalRecordRequest } from '../../models/clinical.model';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';

@Component({
  standalone: true,
  selector: 'app-mri-upload-page',
  imports: [RouterLink, DecimalPipe, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './mri-upload.html',
  styleUrls: ['../medecin-theme.css']
})
export class MriUploadPageComponent {
  protected readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly mriService = inject(MriService);
  private readonly clinicalRecordService = inject(ClinicalRecordService);

  protected readonly patientEmail = signal(this.route.snapshot.paramMap.get('email') ?? '');
  protected readonly clinicalNote = signal('');
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly result = signal<AiAssessment | null>(null);
  protected readonly gradcamUrl = signal<string | null>(null);

  protected readonly gating = signal<ClinicalDataRequired | null>(null);
  protected readonly savingRecord = signal(false);
  protected readonly recordSaved = signal(false);
  protected readonly record = signal<ClinicalRecordRequest>({
    symptoms: '', medicalHistory: '', treatments: '', observations: '', cognitiveScores: ''
  });

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.result.set(null);
    this.error.set(null);
  }

  protected upload(): void {
    const file = this.selectedFile();
    const email = this.patientEmail();
    if (!file || !email) return;

    this.uploading.set(true);
    this.error.set(null);
    this.gating.set(null);

    this.gradcamUrl.set(null);

    this.mriService.upload(email, file, this.clinicalNote()).subscribe({
      next: (assessment) => {
        this.uploading.set(false);
        this.result.set(assessment);
        if (assessment.hasGradCam) {
          this.loadGradcam(assessment.id);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        if (err.status === 409 && err.error?.code === 'CLINICAL_DATA_REQUIRED') {
          this.recordSaved.set(false);
          this.gating.set(err.error as ClinicalDataRequired);
          return;
        }
        this.error.set("L'analyse de l'IRM a échoué. Vérifiez que le fichier est une image .jpg ou .png valide et réessayez.");
      }
    });
  }

  protected updateRecord(field: keyof ClinicalRecordRequest, value: string): void {
    this.record.set({ ...this.record(), [field]: value });
  }

  protected saveClinicalRecord(): void {
    const email = this.patientEmail();
    const r = this.record();
    if (!email || !r.symptoms || !r.medicalHistory || !r.treatments || !r.observations) return;

    this.savingRecord.set(true);
    this.clinicalRecordService.save(email, r).subscribe({
      next: () => {
        this.savingRecord.set(false);
        this.recordSaved.set(true);
        const g = this.gating();
        if (g) this.gating.set({ ...g, missingClinicalRecord: false });
      },
      error: () => {
        this.savingRecord.set(false);
        this.error.set("L'enregistrement du dossier clinique a échoué.");
      }
    });
  }

  protected retryAnalysis(): void {
    this.upload();
  }

  private loadGradcam(assessmentId: string): void {
    this.mriService.gradcamBlob(assessmentId).subscribe({
      next: (blob) => this.gradcamUrl.set(URL.createObjectURL(blob)),
      error: () => {}
    });
  }

  protected probabilityEntries(): { label: string; value: number }[] {
    const probs = this.result()?.cnnResult?.probabilities;
    if (!probs) return [];
    return Object.entries(probs)
      .map(([label, value]) => ({ label, value: value as number }))
      .sort((a, b) => b.value - a.value);
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
