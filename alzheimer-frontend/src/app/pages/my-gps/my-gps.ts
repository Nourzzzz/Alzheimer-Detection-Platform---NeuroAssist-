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
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { GeofencingService } from '../../services/geofencing';
import { LocationResponse, SafeZone } from '../../models/geofencing.model';
import { I18nService } from '../../services/i18n';

const dot = (colour: string, size: number) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;
           background:${colour};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

/** Metres travelled per simulated tick, and how often a tick fires. */
const DEMO_STEP_METERS = 25;
const DEMO_INTERVAL_MS = 3000;

@Component({
  standalone: true,
  selector: 'app-my-gps-page',
  imports: [RouterLink, DatePipe, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './my-gps.html',
  styleUrls: ['../patient-home/patient-home.css', './my-gps.css']
})
export class MyGpsPageComponent implements AfterViewInit, OnDestroy {
  private readonly geofencing = inject(GeofencingService);
  protected readonly i18n = inject(I18nService);

  @ViewChild('map') private mapElement!: ElementRef<HTMLDivElement>;

  protected readonly zone = signal<SafeZone | null>(null);
  protected readonly tracking = signal(false);
  protected readonly demoMode = signal(false);
  protected readonly demoRunning = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly last = signal<LocationResponse | null>(null);
  protected readonly sentCount = signal(0);

  private map?: L.Map;
  private meMarker?: L.Marker;
  private zoneCircle?: L.Circle;

  private watchId: number | null = null;
  private demoTimer: ReturnType<typeof setInterval> | null = null;
  private demoPoint: { lat: number; lon: number } | null = null;
  private demoBearing = Math.random() * 360;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapElement.nativeElement).setView([36.8008, 10.1817], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.geofencing.myZone().subscribe({
      next: (zone) => {
        if (!zone) return;
        this.zone.set(zone);
        this.zoneCircle = L.circle([zone.centerLatitude, zone.centerLongitude], {
          radius: zone.radius, color: '#0f4c81', fillColor: '#0f4c81', fillOpacity: 0.12,
        }).addTo(this.map!);
        L.marker([zone.centerLatitude, zone.centerLongitude], { icon: dot('#0f4c81', 14) })
          .addTo(this.map!);
        this.map!.setView([zone.centerLatitude, zone.centerLongitude], 15);
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    // Leaving the page must release the GPS watch, or it keeps running silently.
    this.stopTracking();
    this.stopDemo();
    this.map?.remove();
  }

  // ── Real GPS ──

  protected toggleTracking(): void {
    if (this.tracking()) {
      this.stopTracking();
      return;
    }
    if (!navigator.geolocation) {
      this.error.set(this.i18n.t('mygps.error.unsupported'));
      return;
    }
    this.error.set(null);
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.send(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, 'browser'),
      (err) => {
        this.stopTracking();
        this.error.set(err.code === err.PERMISSION_DENIED
          ? this.i18n.t('mygps.error.denied')
          : this.i18n.t('mygps.error.unavailable'));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    this.tracking.set(true);
  }

  private stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.tracking.set(false);
  }

  // ── Demo mode ──

  protected toggleDemoMode(enabled: boolean): void {
    this.demoMode.set(enabled);
    if (!enabled) {
      this.stopDemo();
    } else {
      this.stopTracking();
    }
  }

  protected startDemo(): void {
    const zone = this.zone();
    if (!zone) {
      this.error.set(this.i18n.t('mygps.error.noZone'));
      return;
    }
    this.error.set(null);
    this.demoPoint = { lat: zone.centerLatitude, lon: zone.centerLongitude };
    this.demoBearing = Math.random() * 360;
    this.demoRunning.set(true);

    // Same REST call as the real GPS: the whole server path is exercised.
    this.demoTimer = setInterval(() => this.demoTick(), DEMO_INTERVAL_MS);
    this.demoTick();
  }

  protected stopDemo(): void {
    if (this.demoTimer !== null) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    this.demoRunning.set(false);
  }

  /** Walks away from home in a slowly wandering direction. */
  private demoTick(): void {
    if (!this.demoPoint) return;
    this.demoBearing += (Math.random() - 0.5) * 40;

    const rad = (this.demoBearing * Math.PI) / 180;
    // 111 320 m is one degree of latitude; longitude shrinks with the cosine.
    const dLat = (DEMO_STEP_METERS * Math.cos(rad)) / 111_320;
    const dLon = (DEMO_STEP_METERS * Math.sin(rad))
      / (111_320 * Math.cos((this.demoPoint.lat * Math.PI) / 180));

    this.demoPoint = { lat: this.demoPoint.lat + dLat, lon: this.demoPoint.lon + dLon };
    this.send(this.demoPoint.lat, this.demoPoint.lon, 10, 'demo');
  }

  /**
   * Wording for the last fix, built here rather than shown from the response.
   *
   * <p>The server's `message` is English developer-facing text; a patient must
   * read their own language, and it follows the language switch this way.
   */
  protected statusMessage(r: LocationResponse): string {
    if (!r.safeZoneDefined) return this.i18n.t('mygps.msg.noZone');
    if (r.alertRaised) return this.i18n.t('mygps.msg.alerted');
    if (!r.insideSafeZone) return this.i18n.t('mygps.msg.outsideAgain');
    return this.i18n.t('mygps.msg.inside');
  }

  // ── Shared reporting path ──

  private send(latitude: number, longitude: number, accuracy: number, source: string): void {
    this.showMe(latitude, longitude);
    this.geofencing.reportLocation({ latitude, longitude, accuracy, source }).subscribe({
      next: (result) => {
        this.last.set(result);
        this.sentCount.update((n) => n + 1);
      },
      error: () => this.error.set(this.i18n.t('mygps.error.send'))
    });
  }

  private showMe(lat: number, lon: number): void {
    if (!this.map) return;
    if (!this.meMarker) {
      this.meMarker = L.marker([lat, lon], { icon: dot('#dc2626', 14) }).addTo(this.map);
    } else {
      this.meMarker.setLatLng([lat, lon]);
    }
    this.map.panTo([lat, lon]);
  }
}
