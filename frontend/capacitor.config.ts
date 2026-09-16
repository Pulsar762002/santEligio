import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'it.parrocchiasanteligio.app',
  appName: "Parrocchia di Sant'Eligio",
  webDir: 'dist/frontend/browser',
  android: {
    allowMixedContent: false,
  },
};

export default config;
