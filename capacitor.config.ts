import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.fridgemind.app',
  appName: 'FridgeMind',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#f7f4ed',
  ios: {
    contentInset: 'never',
    backgroundColor: '#f7f4ed',
  },
  android: {
    backgroundColor: '#f7f4ed',
    allowMixedContent: false,
    zoomEnabled: false,
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_fridgemind',
      iconColor: '#285c43',
    },
  },
};

export default config;
