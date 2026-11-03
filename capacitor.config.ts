import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.sch.smpialwasi_maros.ambalan',
  appName: 'Pettalopo Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SystemBars: {
      // Gunakan edge-to-edge modern, tetapi biarkan jam dan ikon sistem terlihat.
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false
    }
  }
};

export default config;
