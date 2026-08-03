import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { I18nService } from '../services/i18n';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const i18n = inject(I18nService);

  // Accept-Language rides along on every call so the backend can produce
  // AI content (questionnaire wording, report, patient guidance) in the
  // language the user is currently reading.
  let headers = req.headers.set('Accept-Language', i18n.lang());

  const token = authService.getToken();
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return next(req.clone({ headers }));
};
