import { foodListingQueries, supabaseClient } from '@/modules/database';
import { FoodCardManager } from './FoodCardManager';
import { UIManager } from '@/modules/ui';
import type { FoodListingFilters } from '@/types/database';

export class FoodListManager {
  private static instance: FoodListManager;
  private container: HTMLElement | null = null;
  private options: any;
  private subscription: any;

  private constructor() {}

  public static getInstance(): FoodListManager {
    if (!FoodListManager.instance) FoodListManager.instance = new FoodListManager();
    return FoodListManager.instance;
  }

  initialize(container: HTMLElement, options: { mode: string, userId?: string, filters?: FoodListingFilters }) {
    this.container = container;
    this.options = options;
    this.load();
    this.subscribe();
  }

  async load() {
    if (!this.container) return;
    this.container.innerHTML = FoodCardManager.renderSkeleton().repeat(3);
    try {
      const res = this.options.mode === 'donor-dashboard' 
        ? await foodListingQueries.getByDonor(this.options.userId!) 
        : await foodListingQueries.getAvailable(this.options.filters || {}, 1, 20);
      
      this.container.innerHTML = res.data.map(l => FoodCardManager.render({ listing: l as any, variant: this.options.mode === 'donor-dashboard' ? 'donor' : 'ngo' })).join('') || '<div class="empty-state">No listings found</div>';
    } catch (err) {
      UIManager.getInstance().toast.error('Load failed');
    }
  }

  private subscribe() {
    this.subscription = supabaseClient.client.channel('listings').on(
      'postgres_changes', 
      { event: '*', schema: 'public', table: 'food_listings' }, 
      () => this.load()
    ).subscribe();
  }

  destroy() {
    if (this.subscription) this.subscription.unsubscribe();
    this.container = null;
  }
}