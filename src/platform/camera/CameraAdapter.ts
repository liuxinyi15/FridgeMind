import { Camera, CameraResultType, CameraSource, type PermissionStatus } from '@capacitor/camera';
import { isNativeRuntime } from '../runtime';

export type CameraPurpose = 'camera' | 'library';

export interface CapturedFoodImage {
  webPath?: string;
  format: string;
  source: CameraPurpose;
}

export interface FoodCameraAdapter {
  isAvailable(): boolean;
  checkPermission(): Promise<PermissionStatus | null>;
  requestPermission(purpose: CameraPurpose): Promise<PermissionStatus | null>;
  capture(purpose: CameraPurpose): Promise<CapturedFoodImage>;
}

export class CapacitorFoodCameraAdapter implements FoodCameraAdapter {
  isAvailable() {
    return isNativeRuntime();
  }

  async checkPermission() {
    return this.isAvailable() ? Camera.checkPermissions() : null;
  }

  async requestPermission(purpose: CameraPurpose) {
    if (!this.isAvailable()) return null;
    return Camera.requestPermissions({ permissions: purpose === 'camera' ? ['camera'] : ['photos'] });
  }

  async capture(purpose: CameraPurpose) {
    if (!this.isAvailable()) throw new Error('Native camera is unavailable in the research web build.');
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: purpose === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      quality: 80,
      allowEditing: false,
      correctOrientation: true,
    });
    return { webPath: photo.webPath, format: photo.format, source: purpose };
  }
}

export const foodCamera = new CapacitorFoodCameraAdapter();
