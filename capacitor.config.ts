import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.sch.smpialwasi_maros.ambalan',
  appName: 'Pettalopo Mobile',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false
    }
  },
  server: {
    androidScheme: 'https'
  }
};

export default config;
