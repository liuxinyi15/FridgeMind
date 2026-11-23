import type { Intervention } from '../../domain/types';

export type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface NotificationAdapter {
  readonly channel: 'in_app' | 'native_local';
  isAvailable(): boolean;
  checkPermission(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  deliver(intervention: Intervention): Promise<void>;
}
