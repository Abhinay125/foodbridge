import { FoodCardProps } from './types';
import { I18nManager } from '@/modules/i18n';
import { MAP_CONFIG } from '@/config/maps';

export class FoodCardManager {
  static render(props: FoodCardProps): string {
    const { listing, variant: _variant, distance } = props;
    const t = (k: string) => I18nManager.getInstance().t(k);
    const img = listing.image_urls?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';
    const typeColor = (MAP_CONFIG.MARKER_COLORS as any)[listing.food_type] || '#16834a';

    return `
      <div class="food-card" data-id="${listing.id}">
        <div class="food-card__image-container">
          <img src="${img}" alt="${listing.title}" class="food-card__image">
          <span class="status-badge status-badge--${listing.status}">${t('food.status.' + listing.status)}</span>
        </div>
        <div class="food-card__content">
          <div class="food-card__header">
            <h3 class="food-card__title">${listing.title}</h3>
            <span class="food-type-badge" style="background:${typeColor}">${listing.food_type}</span>
          </div>
          <p class="food-card__description">${listing.description || ''}</p>
          <div class="food-card__meta">
            <span>👥 ${listing.estimated_servings || 1} ${t('food.servings')}</span>
            <span>⌛ ${new Date(listing.expiry_date || listing.available_until).toLocaleDateString()}</span>
          </div>
          <div class="food-card__location">
             📍 ${listing.pickup_city || ''} ${distance ? `(${distance.toFixed(1)} km)` : ''}
          </div>
          <div class="food-card__actions">
             ${this.renderActions(props)}
          </div>
        </div>
      </div>`;
  }

  private static renderActions(props: FoodCardProps): string {
    const t = (k: string) => I18nManager.getInstance().t(k);
    const { variant, listing } = props;
    if (variant === 'donor') return `<button class="btn btn--outline" onclick="FoodFormManager.getInstance().initialize(document.getElementById('form-container'), { mode: 'edit', listingId: '${listing.id}', initialData: ${JSON.stringify(listing).replace(/"/g, '"')}, onSuccess: () => {}, onError: () => {} })">${t('food.edit')}</button>
              <button class="btn btn--danger" onclick="FoodListManager.getInstance().load()">${t('food.delete')}</button>`;
    if (variant === 'ngo') return `<button class="btn btn--primary" onclick="PickupRequestManager.getInstance().initializeForm(document.getElementById('form-container'), { listingId: '${listing.id}', onSuccess: () => {} })">${t('pickup.request')}</button>`;
    return `<button class="btn btn--outline" onclick="alert('View details: ${listing.id}')">${t('food.viewDetails')}</button>`;
  }

  static renderSkeleton(): string {
    return `<div class="food-card skeleton-loader"></div>`;
  }
}