import { AccountStatus } from './admin.model';

export interface PatientResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface PatientDetail {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  genre?: string;
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  contactUrgenceNom?: string;
  contactUrgenceEmail?: string;
  contactUrgenceLien?: string;
  referringDoctorEmail?: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePatientRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  genre?: string;
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
}

export interface UpdatePatientRequest {
  prenom: string;
  nom: string;
  telephone?: string;
  adresse?: string;
  genre?: string;
  dateNaissance?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  /** Relative warned when the patient leaves their safe zone. */
  contactUrgenceNom?: string;
  contactUrgenceEmail?: string;
  contactUrgenceLien?: string;
}
