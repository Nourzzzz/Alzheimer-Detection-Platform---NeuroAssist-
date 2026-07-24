export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface DoctorAdmin {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  numeroOrdre?: string;
  etablissement?: string;
  status: AccountStatus;
  createdAt: string;
}

export interface CreateDoctorRequest {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  specialite?: string;
  password: string;
}

export interface UpdateDoctorRequest {
  prenom: string;
  nom: string;
  telephone: string;
  specialite?: string;
  numeroOrdre?: string;
  etablissement?: string;
}

export interface PatientAdmin {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  referringDoctorEmail?: string;
  status: AccountStatus;
  createdAt: string;
}
