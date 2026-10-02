import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.parrocchiasanteligio.app',
  // nome sotto l'icona (lo spazio è poco); il nome nello store è "Parrocchia Sant'Eligio - Roma"
  appName: "Sant'Eligio",
  webDir: 'dist/frontend/browser',
  android: {
    allowMixedContent: false,
  },
};

export default config;
