import { pickupRequestQueries } from '@/modules/database';
import { PickupStatusAction } from './types';
import { PickupRequestStatus } from '@/types/database';

export class PickupStatusManager {
  private static instance: PickupStatusManager;

  private constructor() {}

  public static getInstance(): PickupStatusManager {
    if (!PickupStatusManager.instance) PickupStatusManager.instance = new PickupStatusManager();
    return PickupStatusManager.instance;
  }

  async transition(requestId: string, action: PickupStatusAction) {
    let status: PickupRequestStatus = 'pending';
    let extra: any = {};

    switch (action) {
      case 'accept': status = 'accepted'; break;
      case 'reject': status = 'rejected'; break;
      case 'confirm': 
        status = 'confirmed'; 
        extra.confirmation_code = Math.floor(100000 + Math.random() * 900000).toString();
        break;
      case 'complete': status = 'completed'; break;
      case 'cancel': status = 'cancelled'; break;
    }

    return await pickupRequestQueries.updateStatus(requestId, status, extra);
  }
}