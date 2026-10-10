import { supabaseClient } from '@/modules/database';
import type { RealtimeSubscriptionConfig, RealtimeEvent } from './types';

export class RealtimeManager {
  private static instance: RealtimeManager;
  private subscriptions: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager();
    }
    return RealtimeManager.instance;
  }

  public initialize(): void {
    // Connection monitoring is handled via channel subscribe callbacks
  }

  public subscribe(config: RealtimeSubscriptionConfig): string {
    const subscriptionId = `${config.table}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const channel = supabaseClient.client
      .channel(subscriptionId)
      .on('postgres_changes', { 
        event: config.event || '*', 
        schema: 'public', 
        table: config.table,
        filter: config.filter 
      }, (payload) => {
        config.callback(this.transformPayload(payload, subscriptionId));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${config.table}`);
        }
      });

    this.subscriptions.set(subscriptionId, channel);
    return subscriptionId;
  }

  private transformPayload(payload: any, subscriptionId: string): RealtimeEvent {
    return {
      type: payload.eventType,
      table: payload.table,
      record: payload.new,
      oldRecord: payload.old,
      timestamp: new Date().toISOString(),
      subscriptionId
    };
  }

  public unsubscribe(subscriptionId: string): void {
    const channel = this.subscriptions.get(subscriptionId);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  public unsubscribeAll(): void {
    this.subscriptions.forEach(channel => channel.unsubscribe());
    this.subscriptions.clear();
  }

  public destroy(): void {
    this.unsubscribeAll();
  }
}