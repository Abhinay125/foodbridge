import { locationShareQueries } from '@/modules/database';
import { RealtimeManager } from './RealtimeManager';
import type { LocationShareUpdate } from './types';

export class LocationShareManager {
  private static instance: LocationShareManager;
  private watchId: number | null = null;
  private activeShareId: string | null = null;

  private constructor() {}

  public static getInstance(): LocationShareManager {
    if (!LocationShareManager.instance) {
      LocationShareManager.instance = new LocationShareManager();
    }
    return LocationShareManager.instance;
  }

  public async startSharing(pickupRequestId: string, userId: string): Promise<string> {
    if (this.watchId) this.stopSharing();

    const initialPos = await this.getCurrentPosition();
    const share = await locationShareQueries.create({
      pickup_request_id: pickupRequestId,
      shared_by: userId,
      current_latitude: initialPos.coords.latitude,
      current_longitude: initialPos.coords.longitude
    });

    this.activeShareId = share.id;

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handlePositionUpdate(pos),
      (err) => console.error('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return this.activeShareId;
  }

  private async handlePositionUpdate(pos: GeolocationPosition): Promise<void> {
    if (!this.activeShareId) return;

    await locationShareQueries.update(this.activeShareId, {
      current_latitude: pos.coords.latitude,
      current_longitude: pos.coords.longitude,
      heading: pos.coords.heading || undefined,
      speed_kmh: pos.coords.speed ? pos.coords.speed * 3.6 : undefined,
      last_update_at: new Date().toISOString()
    });
  }

  public trackLocation(pickupRequestId: string, callback: (update: LocationShareUpdate) => void): string {
    return RealtimeManager.getInstance().subscribe({
      table: 'active_location_shares',
      filter: `pickup_request_id=eq.${pickupRequestId}`,
      callback: (event) => {
        if (event.record) callback(event.record as LocationShareUpdate);
      }
    });
  }

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

  public stopSharing(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.activeShareId) {
      locationShareQueries.update(this.activeShareId, { is_active: false, share_ended_at: new Date().toISOString() });
      this.activeShareId = null;
    }
  }

  public destroy(): void {
    this.stopSharing();
  }
}