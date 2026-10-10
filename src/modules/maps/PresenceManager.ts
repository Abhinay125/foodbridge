import { supabaseClient } from '@/modules/database';
import type { UserPresence } from './types';

export class PresenceManager {
  private static instance: PresenceManager;
  private channels: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): PresenceManager {
    if (!PresenceManager.instance) {
      PresenceManager.instance = new PresenceManager();
    }
    return PresenceManager.instance;
  }

  public joinChannel(channelName: string, user: UserPresence): void {
    const channel = supabaseClient.client.channel(`presence:${channelName}`, {
      config: { presence: { key: user.userId } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // const state = channel.presenceState();
        // console.log('Presence sync:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(user);
        }
      });

    this.channels.set(channelName, channel);
  }

  public leaveChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  public destroy(): void {
    this.channels.forEach(c => c.unsubscribe());
    this.channels.clear();
  }
}