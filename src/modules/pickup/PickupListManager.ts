import { pickupRequestQueries, supabaseClient } from '@/modules/database';
import { PickupCardManager } from './PickupCardManager';

export class PickupListManager {
  private static instance: PickupListManager;
  private container: HTMLElement | null = null;
  private options: any;

  private constructor() {}

  public static getInstance(): PickupListManager {
    if (!PickupListManager.instance) PickupListManager.instance = new PickupListManager();
    return PickupListManager.instance;
  }

  initialize(container: HTMLElement, options: { mode: string, userId: string }) {
    this.container = container;
    this.options = options;
    this.load();
    this.subscribe();
  }

  async load() {
    if (!this.container) return;
    const res = this.options.mode === 'donor-dashboard' 
      ? await pickupRequestQueries.getByDonor(this.options.userId) 
      : await pickupRequestQueries.getByNgo(this.options.userId);
    this.container.innerHTML = (res.data || []).map((r: any) => PickupCardManager.render({ request: r, variant: this.options.mode === 'donor-dashboard' ? 'donor' : 'ngo' })).join('') || '<div class="empty-state">No requests</div>';
  }

  private subscribe() {
    supabaseClient.client.channel('pickups').on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'pickup_requests' }, 
      () => this.load()
    ).subscribe();
  }

  destroy() { this.container = null; }
}