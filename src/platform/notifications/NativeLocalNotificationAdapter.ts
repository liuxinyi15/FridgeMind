import { LocalNotifications } from '@capacitor/local-notifications';
import type { Intervention } from '../../domain/types';
import { isNativeRuntime } from '../runtime';
import type { NotificationAdapter, NotificationPermissionState } from './NotificationAdapter';

function mapPermission(value: string): NotificationPermissionState {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  return 'prompt';
}

export class NativeLocalNotificationAdapter implements NotificationAdapter {
  readonly channel = 'native_local' as const;

  isAvailable() { return isNativeRuntime(); }

  async checkPermission(): Promise<NotificationPermissionState> {
    if (!this.isAvailable()) return 'unavailable';
    const status = await LocalNotifications.checkPermissions();
    return mapPermission(status.display);
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isAvailable()) return 'unavailable';
    const status = await LocalNotifications.requestPermissions();
    return mapPermission(status.display);
  }

  async deliver(intervention: Intervention) {
    if (!this.isAvailable()) return;
    const permission = await this.checkPermission();
    if (permission !== 'granted') throw new Error('Notification permission has not been granted.');
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.abs(intervention.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)),
        title: intervention.title,
        body: intervention.message,
        schedule: { at: new Date(Date.now() + 2_000) },
        extra: { interventionId: intervention.id, foodId: intervention.foodId },
      }],
    });
  }
}

export const nativeNotifications = new NativeLocalNotificationAdapter();
