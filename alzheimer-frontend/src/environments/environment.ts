/**
 * Where the API gateway lives, per runtime.
 *
 * <p>The distinction matters because `localhost` does not mean the same thing
 * in a browser on the development machine and in a web view running on a phone:
 * on the device it resolves to the device itself, so the gateway would be
 * unreachable and every call would fail with a connection error.
 */
export const environment = {
  production: false,

  /** Browser on the development machine: the gateway is on the same host. */
  webApiBaseUrl: 'http://localhost:8080/api',

  /**
   * Android.
   *
   * <ul>
   *   <li>Emulator: `10.0.2.2` is the alias Android gives to the host's
   *       loopback interface, so it reaches the gateway on the PC.</li>
   *   <li>Physical device: replace it with this machine's LAN address
   *       (`ipconfig` → IPv4), and make sure both are on the same network.</li>
   * </ul>
   */
  nativeApiBaseUrl: 'http://10.0.2.2:8080/api',
};
