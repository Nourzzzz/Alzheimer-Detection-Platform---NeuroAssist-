import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import {
  GeocodeMatch,
  LocationRequest,
  LocationResponse,
  PatientLocation,
  SafeZone,
  SafeZoneRequest,
  ZoneAlert,
} from '../models/geofencing.model';

/**
 * Single entry point to the geofencing API.
 *
 * <p>Position reporting goes through one method whatever the source — real GPS
 * or simulated — so the demo mode exercises exactly the same server path as a
 * genuine reading, and a future mobile app will too.
 */
@Injectable({ providedIn: 'root' })
export class GeofencingService {
  private readonly http = inject(HttpClient);
  private readonly locationUrl = `${API_BASE_URL}/location`;
  private readonly zoneUrl = `${API_BASE_URL}/safe-zone`;

  // ── Safe zone ──

  zoneOf(patientId: string): Observable<SafeZone> {
    return this.http.get<SafeZone>(`${this.zoneUrl}/${patientId}`);
  }

  /** The signed-in patient's own zone; no patient id leaves the server. */
  myZone(): Observable<SafeZone> {
    return this.http.get<SafeZone>(`${this.zoneUrl}/me`);
  }

  saveZone(request: SafeZoneRequest): Observable<SafeZone> {
    return this.http.post<SafeZone>(this.zoneUrl, request);
  }

  geocode(query: string): Observable<GeocodeMatch[]> {
    return this.http.get<GeocodeMatch[]>(`${this.zoneUrl}/geocode`,
      { params: new HttpParams().set('q', query) });
  }

  // ── Positions ──

  reportLocation(request: LocationRequest): Observable<LocationResponse> {
    return this.http.post<LocationResponse>(this.locationUrl, request);
  }

  latest(patientId: string): Observable<PatientLocation> {
    return this.http.get<PatientLocation>(`${this.locationUrl}/latest/${patientId}`);
  }

  history(patientId: string): Observable<PatientLocation[]> {
    return this.http.get<PatientLocation[]>(`${this.locationUrl}/history/${patientId}`);
  }

  alerts(patientId: string): Observable<ZoneAlert[]> {
    return this.http.get<ZoneAlert[]>(`${this.locationUrl}/alerts/${patientId}`);
  }
}
