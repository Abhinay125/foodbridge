import { messageQueries } from '@/modules/database';
import { UIManager } from '@/modules/ui';
import { queueOfflineMessage, getQueuedMessages, clearQueuedMessage } from '@/utils/offline';
import type { MessageFormData } from './types';

export class MessageManager {
  private static instance: MessageManager;

  private constructor() {}

  public static getInstance(): MessageManager {
    if (!this.instance) this.instance = new MessageManager();
    return this.instance;
  }

  async sendMessage(data: MessageFormData): Promise<void> {
    // For anonymous access, we'll use a placeholder sender_id
    // In production, this would be handled by the backend with proper auth
    const payload = {
      sender_id: 'anonymous',
      ...data
    };

    try {
      await messageQueries.create(payload as any);
    } catch (error) {
      console.error('Send failed, queuing offline', error);
      await queueOfflineMessage(payload);
      UIManager.getInstance().toast.info('Message queued (Offline)');
    }
  }

  async syncOfflineQueue(): Promise<void> {
    const queued = await getQueuedMessages();
    if (queued.length === 0) return;

    for (const item of queued) {
      try {
        await messageQueries.create(item.payload as any);
        if (item.id) await clearQueuedMessage(item.id);
      } catch (e) {
        break; // Still offline
      }
    }
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await Promise.all(messageIds.map(id => messageQueries.markAsRead(id)));
  }
}