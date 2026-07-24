import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, timer } from 'rxjs';
import { AuthService } from './auth';
import { AssessmentService } from './assessment';

const POLL_INTERVAL_MS = 30000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly auth = inject(AuthService);
  private readonly assessmentService = inject(AssessmentService);

  readonly pendingValidations = signal(0);

  constructor() {
    toObservable(this.auth.isMedecin)
      .pipe(
        switchMap((isMedecin) =>
          isMedecin
            ? timer(0, POLL_INTERVAL_MS).pipe(
                switchMap(() => this.assessmentService.pendingCount().pipe(
                  catchError(() => of({ count: 0 }))
                ))
              )
            : of({ count: 0 })
        )
      )
      .subscribe(({ count }) => this.pendingValidations.set(count));
  }
}
