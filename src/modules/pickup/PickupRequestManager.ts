import { I18nManager } from '@/modules/i18n';
import { UIManager } from '@/modules/ui';
import { pickupRequestQueries } from '@/modules/database';

export class PickupRequestManager {
  private static instance: PickupRequestManager;

  private constructor() {}

  public static getInstance(): PickupRequestManager {
    if (!PickupRequestManager.instance) PickupRequestManager.instance = new PickupRequestManager();
    return PickupRequestManager.instance;
  }

  initializeForm(container: HTMLElement, options: { listingId: string, onSuccess: () => void }) {
    const t = (k: string) => I18nManager.getInstance().t(k);
    container.innerHTML = `
      <form id="request-form" class="form-section">
        <h3>${t('pickup.requestTitle')}</h3>
        <div class="form-field">
          <label>${t('pickup.requestedTime')}</label>
          <input type="datetime-local" name="requested_pickup_time" required>
        </div>
        <div class="form-field">
          <label>${t('pickup.personName')}</label>
          <input type="text" name="requesting_person_name" required>
        </div>
        <div class="form-field">
          <label>${t('pickup.personPhone')}</label>
          <input type="tel" name="requesting_person_phone" required>
        </div>
        <button type="submit" class="btn btn--primary btn--full">${t('pickup.submit')}</button>
      </form>`;

    container.querySelector('form')!.onsubmit = async (e) => {
      e.preventDefault();
      try {
        const fd = new FormData(e.target as HTMLFormElement);
        await pickupRequestQueries.create({ ...Object.fromEntries(fd.entries()), listing_id: options.listingId } as any);
        options.onSuccess();
      } catch (err) {
        UIManager.getInstance().toast.error('Request failed');
      }
    };
  }
}