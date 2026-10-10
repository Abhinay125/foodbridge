import { UIManager } from '@/modules/ui';
import { ImageUploadManager } from './ImageUploadManager';
import { UPLOAD_LIMITS } from './types';
import { foodListingQueries, supabaseClient } from '@/modules/database';
import L from 'leaflet';

export class FoodFormManager {
  private static instance: FoodFormManager;
  private container: HTMLElement | null = null;
  private map: L.Map | null = null;
  private options: any;

  private constructor() {}

  public static getInstance(): FoodFormManager {
    if (!FoodFormManager.instance) FoodFormManager.instance = new FoodFormManager();
    return FoodFormManager.instance;
  }

  initialize(container: HTMLElement, options: { mode: 'create' | 'edit', listingId?: string, initialData?: any, onSuccess: (id: string) => void, onError: (err: any) => void }) {
    this.container = container;
    this.options = options;
    this.render();
    this.initMap();
    this.attachEvents();
  }

  private render() {
    if (!this.container) return;
    const d = this.options.initialData || {};
    
    this.container.innerHTML = `
      <form class="donation-form" id="donationForm">
        <div class="form-grid">
          <!-- 1. Restaurant / Donor Name -->
          <div class="form-group">
            <label for="donorName">
              Restaurant / Donor Name <span class="required">*</span>
            </label>
            <input id="donorName" name="donorName" type="text" required maxlength="100"
                   placeholder="Restaurant or donor name" value="${d.donorName || d.title || ''}">
          </div>

          <!-- 2. Food Name -->
          <div class="form-group">
            <label for="foodName">
              Food Name <span class="required">*</span>
            </label>
            <input id="foodName" name="foodName" type="text" required maxlength="100"
                   placeholder="e.g. Vegetable biryani" value="${d.foodName || ''}">
          </div>

          <!-- 3. Food Type -->
          <div class="form-group">
            <label for="foodType">
              Food Type <span class="required">*</span>
            </label>
            <select id="foodType" name="foodType" required>
              <option value="">Select food type</option>
              <option value="Veg" ${d.foodType === 'Veg' ? 'selected' : ''}>Vegetarian</option>
              <option value="Non-Veg" ${d.foodType === 'Non-Veg' ? 'selected' : ''}>Non-Vegetarian</option>
            </select>
          </div>

          <!-- 4. Number of Servings -->
          <div class="form-group">
            <label for="quantity">
              Number of Servings <span class="required">*</span>
            </label>
            <input id="quantity" name="quantity" type="number" min="1" max="10000"
                   step="1" required placeholder="e.g. 20" value="${d.quantity || d.estimated_servings || ''}">
          </div>

          <!-- 5. Preparation Date & Time -->
          <div class="form-group">
            <label for="preparedAt">
              Preparation Date & Time <span class="required">*</span>
            </label>
            <input id="preparedAt" name="preparedAt" type="datetime-local" required
                   value="${d.preparedAt || ''}">
          </div>

          <!-- 6. Pickup Deadline -->
          <div class="form-group">
            <label for="pickupTime">
              Pickup Deadline <span class="required">*</span>
            </label>
            <input id="pickupTime" name="pickupTime" type="datetime-local" required
                   value="${d.pickupTime || ''}">
          </div>

          <!-- 7. Storage Method -->
          <div class="form-group">
            <label for="storage">
              Storage Method <span class="required">*</span>
            </label>
            <select id="storage" name="storage" required>
              <option value="">Select storage method</option>
              <option value="Kept hot safely" ${d.storage === 'Kept hot safely' ? 'selected' : ''}>Kept hot safely</option>
              <option value="Refrigerated" ${d.storage === 'Refrigerated' ? 'selected' : ''}>Refrigerated</option>
              <option value="Frozen" ${d.storage === 'Frozen' ? 'selected' : ''}>Frozen</option>
              <option value="Room temperature" ${d.storage === 'Room temperature' ? 'selected' : ''}>Room temperature</option>
              <option value="Other / unsure" ${d.storage === 'Other / unsure' ? 'selected' : ''}>Other / unsure</option>
            </select>
          </div>

          <!-- 8. Food Condition -->
          <div class="form-group">
            <label for="foodCondition">
              Food Condition <span class="required">*</span>
            </label>
            <select id="foodCondition" name="foodCondition" required>
              <option value="">Select condition</option>
              <option value="Fresh and properly stored" ${d.foodCondition === 'Fresh and properly stored' ? 'selected' : ''}>
                Fresh and properly stored
              </option>
              <option value="Quality uncertain" ${d.foodCondition === 'Quality uncertain' ? 'selected' : ''}>
                Quality uncertain
              </option>
              <option value="Spoiled or unsafe" ${d.foodCondition === 'Spoiled or unsafe' ? 'selected' : ''}>
                Spoiled or unsafe
              </option>
            </select>
          </div>

          <!-- 9. Food Photo -->
          <div class="form-group full">
            <label for="foodPhoto">
              Food Photo <span class="required">*</span>
            </label>
            <input id="foodPhoto" name="foodPhoto" type="file" accept="image/*" required>
            <span class="form-help">
              Select a clear photo of the actual food.
            </span>
            <img id="photoPreview" alt="Food photo preview"
                 style="display:none;max-width:220px;max-height:180px;object-fit:cover;border-radius:12px;">
          </div>

          <!-- 10. Pickup Address -->
          <div class="form-group full">
            <label for="address">
              Pickup Address <span class="required">*</span>
            </label>
            <textarea id="address" name="address" required maxlength="500"
                      placeholder="Full address and nearby landmark">${d.address || d.pickup_address || ''}</textarea>
          </div>

          <!-- 11. Contact Number -->
          <div class="form-group full">
            <label for="contact">
              Contact Number <span class="required">*</span>
            </label>
            <input id="contact" name="contact" type="tel" required
                   pattern="[0-9+\\-\\s()]{8,20}" maxlength="20"
                   placeholder="Contact number" value="${d.contact || d.pickup_contact_phone || ''}">
          </div>

          <!-- 12. Pin Your Pickup Location -->
          <div class="form-group full">
            <label for="donorLocation">
              Pin Your Pickup Location <span class="required">*</span>
            </label>
            <button class="secondary-button" id="getDonorLocation" type="button">
              📍 Use My Current Location
            </button>
            <span class="form-help" id="donorLocationStatus">
              Allow location access or enter coordinates below.
            </span>
          </div>

          <!-- 13. Latitude -->
          <div class="form-group">
            <label for="donorLat">Latitude <span class="required">*</span></label>
            <input id="donorLat" name="latitude" type="number" step="any" required
                   min="-90" max="90" placeholder="e.g. 17.385" value="${d.latitude || d.pickup_latitude || ''}">
          </div>

          <!-- 14. Longitude -->
          <div class="form-group">
            <label for="donorLng">Longitude <span class="required">*</span></label>
            <input id="donorLng" name="longitude" type="number" step="any" required
                   min="-180" max="180" placeholder="e.g. 78.4867" value="${d.longitude || d.pickup_longitude || ''}">
          </div>

          <!-- 15. Ingredients, Allergens & Other Details -->
          <div class="form-group full">
            <label for="notes">Ingredients, Allergens & Other Details</label>
            <textarea id="notes" name="notes" maxlength="1000"
                      placeholder="Mention known allergens, ingredients, packaging, and pickup instructions">${d.notes || d.description || ''}</textarea>
          </div>
        </div>

        <!-- Safety checkboxes -->
        <div class="safety-box">
          <h3>🛡️ Food Safety Confirmation</h3>
          <p>
            Only donate food that is suitable for consumption and has
            been handled and stored safely. A photograph cannot prove
            that food is safe.
          </p>
          <label class="checkbox-row">
            <input type="checkbox" id="safeHandling" name="safeHandling" required>
            <span>I confirm that the food has been handled and stored appropriately. *</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="allergenInfo" name="allergenInfo" required>
            <span>I have provided known ingredient and allergen information. *</span>
          </label>
          <label class="checkbox-row">
            <input type="checkbox" id="accurateDetails" name="accurateDetails" required>
            <span>The food details, times, address and contact details are accurate. *</span>
          </label>
        </div>

        <button class="primary-button" type="submit">
          Submit Food Donation
        </button>

        <div class="form-message" id="formMessage" role="status" aria-live="polite"></div>
      </form>`;
  }

  private initMap() {
    // No map needed - using geolocation button instead
  }

  private attachEvents() {
    const form = this.container?.querySelector('#donationForm') as HTMLFormElement;
    const photoInput = this.container?.querySelector('#foodPhoto') as HTMLInputElement;
    const photoPreview = this.container?.querySelector('#photoPreview') as HTMLImageElement;
    const getLocationBtn = this.container?.querySelector('#getDonorLocation') as HTMLButtonElement;
    const locationStatus = this.container?.querySelector('#donorLocationStatus') as HTMLElement;
    const preparedAt = this.container?.querySelector('#preparedAt') as HTMLInputElement;
    const pickupTime = this.container?.querySelector('#pickupTime') as HTMLInputElement;
    const foodCondition = this.container?.querySelector('#foodCondition') as HTMLSelectElement;
    const formMessage = this.container?.querySelector('#formMessage') as HTMLElement;

    // Photo preview handler
    photoInput?.addEventListener('change', () => {
      const file = photoInput.files?.[0];

      if (!file) {
        photoPreview.style.display = 'none';
        photoPreview.removeAttribute('src');
        return;
      }

      if (!file.type.startsWith('image/')) {
        UIManager.getInstance().toast.error('Please select an image file.');
        photoInput.value = '';
        photoPreview.style.display = 'none';
        return;
      }

      if (file.size > UPLOAD_LIMITS.MAX_SIZE) {
        UIManager.getInstance().toast.error(`Please select a photo smaller than ${UPLOAD_LIMITS.MAX_SIZE / 1024 / 1024} MB.`);
        photoInput.value = '';
        photoPreview.style.display = 'none';
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        photoPreview.src = event.target?.result as string;
        photoPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    // Geolocation button handler
    getLocationBtn?.addEventListener('click', () => {
      locationStatus.textContent = 'Requesting location permission...';

      if (!navigator.geolocation) {
        locationStatus.textContent = 'Location is unavailable in this browser. Enter coordinates manually.';
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latInput = this.container?.querySelector('#donorLat') as HTMLInputElement;
          const lngInput = this.container?.querySelector('#donorLng') as HTMLInputElement;
          latInput.value = position.coords.latitude.toFixed(6);
          lngInput.value = position.coords.longitude.toFixed(6);
          locationStatus.textContent = 'Location added successfully.';
        },
        () => {
          locationStatus.textContent = 'Could not get location. Allow permission or enter coordinates manually.';
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

    // Date/time validation helpers
    const toLocalDateTimeValue = (date: Date): string => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const setMinimumTimes = () => {
      const nowValue = toLocalDateTimeValue(new Date());
      preparedAt.max = nowValue;
      pickupTime.min = nowValue;
    };

    setMinimumTimes();

    const validatePickupTimes = () => {
      pickupTime.setCustomValidity('');

      if (!preparedAt.value || !pickupTime.value) return;

      const preparation = new Date(preparedAt.value);
      const pickup = new Date(pickupTime.value);
      const now = new Date();

      if (preparation > now) {
        preparedAt.setCustomValidity('Preparation time cannot be in the future.');
      } else {
        preparedAt.setCustomValidity('');
      }

      if (pickup <= preparation) {
        pickupTime.setCustomValidity('Pickup deadline must be after preparation time.');
      } else if (pickup <= now) {
        pickupTime.setCustomValidity('Pickup deadline must be in the future.');
      } else {
        pickupTime.setCustomValidity('');
      }
    };

    preparedAt?.addEventListener('change', validatePickupTimes);
    pickupTime?.addEventListener('change', validatePickupTimes);

    // Food condition validation
    foodCondition?.addEventListener('change', () => {
      if (foodCondition.value === 'Spoiled or unsafe') {
        formMessage.textContent = 'Food reported as spoiled or unsafe must not be donated for consumption.';
        formMessage.className = 'form-message show error';
      } else {
        formMessage.textContent = '';
        formMessage.className = 'form-message';
      }
    });

    // Form submit handler
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      formMessage.className = 'form-message';
      formMessage.textContent = '';

      validatePickupTimes();

      if (!form.reportValidity()) return;

      if (foodCondition.value !== 'Fresh and properly stored') {
        formMessage.textContent = 'This donation cannot be published. Only food confirmed as fresh and properly stored can be listed.';
        formMessage.className = 'form-message show error';
        return;
      }

      const photoFile = photoInput?.files?.[0];

      if (!photoFile || !photoFile.type.startsWith('image/')) {
        formMessage.textContent = 'Please upload a valid food photo.';
        formMessage.className = 'form-message show error';
        return;
      }

      if (photoFile.size > UPLOAD_LIMITS.MAX_SIZE) {
        formMessage.textContent = `Please use a photo smaller than ${UPLOAD_LIMITS.MAX_SIZE / 1024 / 1024} MB.`;
        formMessage.className = 'form-message show error';
        return;
      }

      const latInput = this.container?.querySelector('#donorLat') as HTMLInputElement;
      const lngInput = this.container?.querySelector('#donorLng') as HTMLInputElement;
      const lat = Number(latInput?.value);
      const lng = Number(lngInput?.value);

      if (
        !Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lng) || lng < -180 || lng > 180
      ) {
        formMessage.textContent = 'Please enter valid pickup coordinates.';
        formMessage.className = 'form-message show error';
        return;
      }

      try {
        // Upload photo to Supabase Storage
        const uploaded = await ImageUploadManager.getInstance().upload(
          photoFile,
          'anonymous',
          'temp'
        );

        const fd = new FormData(form);
        const listingData = {
          donor_id: 'anonymous',
          title: fd.get('foodName') as string,
          description: fd.get('notes') as string,
          food_type: 'prepared_food' as const,
          quantity_description: `${fd.get('quantity')} servings`,
          estimated_servings: parseInt(fd.get('quantity') as string),
          preparation_date: (fd.get('preparedAt') as string).split('T')[0],
          expiry_date: (fd.get('pickupTime') as string).split('T')[0],
          storage_instructions: fd.get('storage') as string,
          allergen_info: [] as string[],
          is_vegetarian: fd.get('foodType') === 'Veg',
          is_vegan: false,
          is_halal: false,
          is_kosher: false,
          pickup_address_line1: fd.get('address') as string,
          pickup_address_line2: '',
          pickup_city: '',
          pickup_state: '',
          pickup_postal_code: '',
          pickup_latitude: lat,
          pickup_longitude: lng,
          image_urls: [uploaded.url],
          available_from: new Date().toISOString(),
          available_until: fd.get('pickupTime') as string,
          status: 'available' as const,
          special_instructions: fd.get('notes') as string,
          requires_refrigeration: fd.get('storage') === 'Refrigerated' || fd.get('storage') === 'Frozen',
        };

        // Create food listing
        const listing = await foodListingQueries.create(listingData as any);
        const listingId = listing.id;

        // Create pickup details
        await supabaseClient.client.from('food_pickup_details').insert({
          listing_id: listingId,
          preferred_pickup_times: [`${fd.get('preparedAt')} - ${fd.get('pickupTime')}`],
          pickup_contact_name: fd.get('donorName') as string,
          pickup_contact_phone: fd.get('contact') as string,
          pickup_contact_email: '',
          parking_instructions: '',
          building_access_code: '',
          floor_level: '',
          elevator_available: false,
          packaging_type: undefined,
          number_of_packages: undefined,
          requires_containers: false,
          donor_provides_packaging: true,
          assistance_available: false,
          assistance_description: '',
          suggested_vehicle_type: undefined,
          estimated_weight_kg: undefined,
          estimated_volume_m3: undefined,
          requires_insulated_transport: false,
          requires_refrigerated_transport: fd.get('storage') === 'Refrigerated' || fd.get('storage') === 'Frozen',
          pickup_notes: fd.get('notes') as string,
        });

        this.options.onSuccess(listingId);

        // Show success message
        formMessage.textContent = 'Donation published successfully! Your listing is now available.';
        formMessage.className = 'form-message show';

        // Reset form
        form.reset();
        photoPreview.style.display = 'none';
        photoPreview.removeAttribute('src');
        setMinimumTimes();

        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      } catch (err) {
        console.error('Submission error:', err);
        formMessage.textContent = 'Failed to submit donation. Please try again.';
        formMessage.className = 'form-message show error';
      }
    });
  }

  destroy() {
    if (this.map) { this.map.remove(); this.map = null; }
    this.container = null;
  }
}