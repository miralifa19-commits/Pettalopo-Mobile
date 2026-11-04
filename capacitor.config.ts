import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.sch.smpialwasi_maros.ambalan',
  appName: 'Pettalopo Mobile',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      // DARK is the Capacitor setting for dark (black) system icons on a light background.
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
