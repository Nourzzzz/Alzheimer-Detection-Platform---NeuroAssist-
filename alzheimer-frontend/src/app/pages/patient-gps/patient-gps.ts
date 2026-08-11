import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { GeofencingService } from '../../services/geofencing';
import { PatientService } from '../../services/patient';
import {
  GeocodeMatch,
  LocationResponse,
  PatientLocation,
  ZoneAlert,
} from '../../models/geofencing.model';
import { MedecinSidebarComponent } from '../../components/medecin-sidebar/medecin-sidebar';
import { I18nService } from '../../services/i18n';

/** Markers drawn in CSS, so no Leaflet icon assets need shipping. */
const dot = (colour: string, size: number) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;
           background:${colour};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

@Component({
  standalone: true,
  selector: 'app-patient-gps-page',
  imports: [RouterLink, DatePipe, DecimalPipe, MedecinSidebarComponent],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './patient-gps.html',
  styleUrls: ['../medecin-theme.css', './patient-gps.css']
})
export class PatientGpsPageComponent implements AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly geofencing = inject(GeofencingService);
  private readonly patientService = inject(PatientService);
  protected readonly i18n = inject(I18nService);

  @ViewChild('map') private mapElement!: ElementRef<HTMLDivElement>;

  protected readonly patientId = this.route.snapshot.paramMap.get('id') ?? '';
  protected readonly patientName = signal('');
  protected readonly contactEmail = signal<string | null>(null);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly locating = signal(false);
  protected readonly selfTest = signal<LocationResponse | null>(null);

  protected readonly centre = signal<{ lat: number; lon: number } | null>(null);
  protected readonly radius = signal(150);
  protected readonly address = signal('');
  protected readonly matches = signal<GeocodeMatch[]>([]);
  protected readonly searching = signal(false);

  protected readonly lastPosition = signal<PatientLocation | null>(null);
  protected readonly history = signal<PatientLocation[]>([]);
  protected readonly alerts = signal<ZoneAlert[]>([]);

  private map?: L.Map;
  private homeMarker?: L.Marker;
  private zoneCircle?: L.Circle;
  private patientMarker?: L.Marker;
  private trail?: L.Polyline;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([36.8008, 10.1817], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => this.setCentre(e.latlng.lat, e.latlng.lng));

    this.load();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private load(): void {
    this.patientService.get(this.patientId).subscribe({
      next: (p) => {
        this.patientName.set(`${p.prenom} ${p.nom}`.trim());
        this.contactEmail.set(p.contactUrgenceEmail ?? null);
      },
      error: () => {}
    });

    this.geofencing.zoneOf(this.patientId).subscribe({
      next: (zone) => {
        if (!zone) return;
        this.radius.set(zone.radius);
        this.address.set(zone.address ?? '');
        this.setCentre(zone.centerLatitude, zone.centerLongitude);
        this.map?.setView([zone.centerLatitude, zone.centerLongitude], 15);
      },
      error: () => {}
    });

    this.refreshPositions();
  }

  protected refreshPositions(): void {
    this.geofencing.latest(this.patientId).subscribe({
      next: (position) => {
        if (!position) return;
        this.lastPosition.set(position);
        this.showPatient(position.latitude, position.longitude);
      },
      error: () => {}
    });
    this.geofencing.history(this.patientId).subscribe({
      next: (list) => {
        this.history.set(list);
        this.drawTrail(list);
      },
      error: () => {}
    });
    this.geofencing.alerts(this.patientId).subscribe({
      next: (list) => this.alerts.set(list),
      error: () => {}
    });
  }

  // ── Map ──

  private setCentre(lat: number, lon: number): void {
    this.centre.set({ lat, lon });
    if (!this.map) return;

    if (!this.homeMarker) {
      this.homeMarker = L.marker([lat, lon], { icon: dot('#0f4c81', 16), draggable: true })
        .addTo(this.map)
        .on('dragend', (e) => {
          const p = (e.target as L.Marker).getLatLng();
          this.setCentre(p.lat, p.lng);
        });
    } else {
      this.homeMarker.setLatLng([lat, lon]);
    }

    if (!this.zoneCircle) {
      this.zoneCircle = L.circle([lat, lon], {
        radius: this.radius(), color: '#0f4c81', fillColor: '#0f4c81', fillOpacity: 0.12,
      }).addTo(this.map);
    } else {
      this.zoneCircle.setLatLng([lat, lon]);
    }
  }

  private showPatient(lat: number, lon: number): void {
    if (!this.map) return;
    if (!this.patientMarker) {
      this.patientMarker = L.marker([lat, lon], { icon: dot('#dc2626', 14) }).addTo(this.map);
    } else {
      this.patientMarker.setLatLng([lat, lon]);
    }
  }

  /** Oldest first, so the line reads in the direction the patient walked. */
  private drawTrail(list: PatientLocation[]): void {
    if (!this.map) return;
    const points: L.LatLngExpression[] = [...list]
      .reverse()
      .map((p) => [p.latitude, p.longitude]);
    if (this.trail) {
      this.trail.setLatLngs(points);
    } else {
      this.trail = L.polyline(points, { color: '#dc2626', weight: 2, opacity: 0.6 }).addTo(this.map);
    }
  }

  protected setRadius(value: string): void {
    const metres = Number(value);
    this.radius.set(metres);
    this.zoneCircle?.setRadius(metres);
  }

  // ── Address search ──

  protected search(): void {
    const query = this.address().trim();
    if (!query) return;
    this.searching.set(true);
    this.error.set(null);
    this.geofencing.geocode(query).subscribe({
      next: (results) => {
        this.searching.set(false);
        this.matches.set(results);
        if (results.length === 0) {
          this.error.set(this.i18n.t('gps.error.noMatch'));
        }
      },
      error: () => {
        this.searching.set(false);
        this.error.set(this.i18n.t('gps.error.geocode'));
      }
    });
  }

  protected pick(match: GeocodeMatch): void {
    this.address.set(match.displayName);
    this.matches.set([]);
    this.setCentre(match.latitude, match.longitude);
    this.map?.setView([match.latitude, match.longitude], 16);
  }

  // ── Save ──

  protected saveZone(): void {
    const c = this.centre();
    if (!c) {
      this.error.set(this.i18n.t('gps.error.noCentre'));
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.geofencing.saveZone({
      patientId: this.patientId,
      centerLatitude: c.lat,
      centerLongitude: c.lon,
      radius: this.radius(),
      address: this.address().trim() || undefined
    }).subscribe({
      next: () => this.saving.set(false),
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? this.i18n.t('gps.error.save'));
      }
    });
  }

  /** Same reasoning as the patient page: the server message is English. */
  protected statusMessage(r: LocationResponse): string {
    if (!r.safeZoneDefined) return this.i18n.t('gps.msg.noZone');
    if (r.alertRaised) return this.i18n.t('gps.msg.alerted');
    if (!r.insideSafeZone) return this.i18n.t('gps.msg.outsideAgain');
    return this.i18n.t('gps.msg.inside');
  }

  protected focus(position: PatientLocation): void {
    this.map?.setView([position.latitude, position.longitude], 17);
    this.showPatient(position.latitude, position.longitude);
  }

  /**
   * Reports this machine's position as if it were the patient's.
   *
   * <p>Turns the test around: instead of walking out of the zone, the doctor
   * places the zone somewhere else and this fixed position is already outside
   * it. It goes through the ordinary reporting endpoint, so the whole
   * evaluation, alert and email path runs exactly as it would in the field.
   */
  protected useMyPosition(): void {
    if (!navigator.geolocation) {
      this.error.set(this.i18n.t('gps.error.unsupported'));
      return;
    }
    this.locating.set(true);
    this.error.set(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.geofencing.reportLocation({
          patientId: this.patientId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'doctor-device'
        }).subscribe({
          next: (result) => {
            this.locating.set(false);
            this.selfTest.set(result);
            this.refreshPositions();
          },
          error: (err) => {
            this.locating.set(false);
            this.error.set(err?.error?.message ?? this.i18n.t('gps.error.report'));
          }
        });
      },
      (err) => {
        this.locating.set(false);
        this.error.set(err.code === err.PERMISSION_DENIED
          ? this.i18n.t('gps.error.denied')
          : this.i18n.t('gps.error.unavailable'));
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  }
}
