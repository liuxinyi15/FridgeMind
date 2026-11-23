import type { Intervention } from '../../domain/types';
import type { NotificationAdapter, NotificationPermissionState } from './NotificationAdapter';

export class InAppNotificationAdapter implements NotificationAdapter {
  readonly channel = 'in_app' as const;
  isAvailable() { return true; }
  async checkPermission(): Promise<NotificationPermissionState> { return 'granted'; }
  async requestPermission(): Promise<NotificationPermissionState> { return 'granted'; }
  async deliver(_intervention: Intervention) {
    // App state already renders the intervention on Today. Delivery is intentionally side-effect free.
  }
}
