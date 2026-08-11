import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alzheimer.neuroassist',
  appName: 'NeuroAssist',

  // Angular 17+ emits the browser bundle in a `browser/` sub-folder; pointing
  // at `dist/alzheimer-frontend` alone would copy an app with no index.html.
  webDir: 'dist/alzheimer-frontend/browser',

  android: {
    // The origin the web view runs under, and therefore the Origin header the
    // gateway sees. Changing it means changing the CORS allow-list too.
    androidScheme: 'https',
  },

  // Live reload during development: point the web view at the Angular dev
  // server instead of the bundled files, so a save refreshes the phone.
  // Replace the IP with this machine's LAN address, then run `npx cap sync`.
  //
  // server: {
  //   url: 'http://192.168.1.10:4200',
  //   cleartext: true,
  // },
};

export default config;
