import { Capacitor } from '@capacitor/core';
import { environment } from '../../environments/environment';

/**
 * Base URL of the API gateway, resolved once at load time.
 *
 * <p>Every existing service keeps importing this constant unchanged; only the
 * value it holds now depends on where the app is running.
 */
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? environment.nativeApiBaseUrl
  : environment.webApiBaseUrl;
