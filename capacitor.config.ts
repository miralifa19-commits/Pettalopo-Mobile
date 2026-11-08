import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'id.sch.smpialwasi_maros.ambalan',
  appName: 'Pettalopo Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'firestore.googleapis.com',
      'identitytoolkit.googleapis.com',
      'securetoken.googleapis.com',
      'accounts.google.com',
      '*.googleapis.com',
      '*.firebaseio.com',
      '*.firebaseapp.com'
    ]
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#C81E28',
      overlaysWebView: false
    },
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ['google.com']
    }
  }
};

export default config;
