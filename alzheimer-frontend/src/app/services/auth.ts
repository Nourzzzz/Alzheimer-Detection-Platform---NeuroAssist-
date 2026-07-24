import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api-config';

export const ROLES = {
  MEDECIN: 'MEDECIN',
  PATIENT: 'PATIENT',
  ADMIN: 'ADMIN'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  role: string;
  telephone?: string;
  genre?: string;
  dateNaissance?: string;
  specialite?: string;
  numeroOrdre?: string;
  etablissement?: string;
  groupeSanguin?: string;
  antecedentsMedicaux?: string;
  referringDoctorEmail?: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  prenom: string;
  nom: string;
  email: string;
}

export interface DoctorOption {
  email: string;
  prenom: string;
  nom: string;
  specialite?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = `${API_BASE_URL}/auth`;

  private readonly session = signal<AuthResponse | null>(this.readSessionFromStorage());

  readonly currentUser = this.session.asReadonly();
  readonly isLoggedIn = computed(() => !!this.session());
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isMedecin = computed(() => this.session()?.role === ROLES.MEDECIN);
  readonly isPatient = computed(() => this.session()?.role === ROLES.PATIENT);
  readonly isAdmin = computed(() => this.session()?.role === ROLES.ADMIN);

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.saveSession(response))
    );
  }

  listDoctorOptions(): Observable<DoctorOption[]> {
    return this.http.get<DoctorOption[]>(`${this.apiUrl}/doctors`);
  }

  logout(): void {
    localStorage.clear();
    this.session.set(null);
  }

  getToken(): string | null {
    return this.session()?.token ?? null;
  }

  getRole(): string | null {
    return this.role();
  }

  getPrenom(): string | null {
    return this.session()?.prenom ?? null;
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
    localStorage.setItem('prenom', response.prenom);
    localStorage.setItem('nom', response.nom);
    localStorage.setItem('email', response.email);
    this.session.set(response);
  }

  private readSessionFromStorage(): AuthResponse | null {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    return {
      token,
      role: localStorage.getItem('role') ?? '',
      prenom: localStorage.getItem('prenom') ?? '',
      nom: localStorage.getItem('nom') ?? '',
      email: localStorage.getItem('email') ?? ''
    };
  }
}
