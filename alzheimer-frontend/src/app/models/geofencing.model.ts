export interface SafeZone {
  id: string;
  patientId: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  address: string | null;
  definedByEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface SafeZoneRequest {
  patientId: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  address?: string;
}

export interface PatientLocation {
  id: string;
  patientId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  distanceFromCentre: number | null;
  insideSafeZone: boolean | null;
  source: string;
  timestamp: string;
}

/** One position fix, whatever produced it. */
export interface LocationRequest {
  patientId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
}

export interface LocationResponse {
  patientId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  safeZoneDefined: boolean;
  insideSafeZone: boolean;
  distanceFromCentre: number;
  radius: number;
  alertRaised: boolean;
  message: string;
}

export interface ZoneAlert {
  id: string;
  patientId: string;
  type: string;
  message: string;
  latitude: number;
  longitude: number;
  distanceFromCentre: number;
  timestamp: string;
  notifiedEmail: string | null;
  emailSent: boolean;
  deliveryNote: string | null;
}

export interface GeocodeMatch {
  latitude: number;
  longitude: number;
  displayName: string;
}
