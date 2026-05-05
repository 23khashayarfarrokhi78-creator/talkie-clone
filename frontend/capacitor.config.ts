import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talkie.personal',
  appName: 'Talkie',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
