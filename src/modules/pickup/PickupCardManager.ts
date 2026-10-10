import { PickupCardProps } from './types';
import { I18nManager } from '@/modules/i18n';

export class PickupCardManager {
  static render(props: PickupCardProps): string {
    const { request, variant: _variant } = props;
    const t = (k: string) => I18nManager.getInstance().t(k);
    return `
      <div class="pickup-card" data-id="${request.id}">
        <div class="pickup-card__header">
          <h4>${request.food_listings?.title || 'Food Pickup'}</h4>
          <span class="status-badge status-badge--${request.status}">${t('pickup.status.' + request.status)}</span>
        </div>
        <div class="pickup-card__body">
          <p>👤 ${request.requesting_person_name}</p>
          <p>📞 ${request.requesting_person_phone}</p>
          <p>⏰ ${new Date(request.requested_pickup_time).toLocaleString()}</p>
          ${request.status === 'confirmed' ? `<p class="confirmation-code">Code: ${request.confirmation_code}</p>` : ''}
        </div>
        <div class="pickup-card__actions">
           ${this.renderActions(props)}
        </div>
      </div>`;
  }

  private static renderActions(props: PickupCardProps): string {
    const { request, variant } = props;
    const t = (k: string) => I18nManager.getInstance().t(k);
    if (variant === 'donor' && request.status === 'pending') {
      return `<button class="btn btn--sm" data-action="accept">${t('pickup.actions.accept')}</button>
              <button class="btn btn--sm btn--danger" data-action="reject">${t('pickup.actions.reject')}</button>`;
    }
    if (variant === 'ngo' && request.status === 'accepted') {
      return `<button class="btn btn--sm" data-action="confirm">${t('pickup.actions.confirm')}</button>`;
    }
    return '';
  }

  static renderSkeleton(): string {
    return `<div class="pickup-card skeleton-loader"></div>`;
  }
}