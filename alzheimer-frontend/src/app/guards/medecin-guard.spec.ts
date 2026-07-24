import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { medecinGuard } from './medecin-guard';

describe('medecinGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => medecinGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
