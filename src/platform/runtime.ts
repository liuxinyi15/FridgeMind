import { Capacitor } from '@capacitor/core';

export type RuntimePlatform = 'web' | 'ios' | 'android';

export function getRuntimePlatform(): RuntimePlatform {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android' ? platform : 'web';
}

export function isNativeRuntime() {
  return Capacitor.isNativePlatform();
}
