import { PageConfig } from './types';
import { I18nManager } from '@/modules/i18n';
import { ngoAuthManager } from '@/modules/auth/NgoAuthManager';
import { ngoLocationQueries } from '@/modules/database/queries';
import type { NgoLocationInsert } from '@/types/database';
import L from 'leaflet';

export const OrganisationsPage: PageConfig = {
  path: '/organisations',
  title: 'organisations.title',
  init: async (container) => {
    const t = (k: string) => I18nManager.getInstance().t(k);
    
    // Check authentication state
    const isAuthenticated = ngoAuthManager.isAuthenticated();

    // Render initial HTML
    container.innerHTML = `
      <div class="organisations-page">
        <button class="back-button" type="button" data-back>
          ← <span data-i18n="common.back">${t('common.back')}</span>
        </button>
        
        <h2 class="section-title" data-i18n="organisations.title">${t('organisations.title')}</h2>
        <p class="section-description" data-i18n="organisations.description">${t('organisations.description')}</p>
        
        <div class="form-message" id="orgMessage"></div>
        
        ${!isAuthenticated ? renderLoginForm(t) : renderDashboard(t)}
      </div>
    `;

    // Set up event listeners based on auth state
    if (!isAuthenticated) {
      setupLoginForm(container, t);
    } else {
      setupDashboard(container, t);
    }

    // Back button handler
    container.querySelector('[data-back]')?.addEventListener('click', () => {
      window.history.back();
    });
  },
  destroy: () => {}
};

function renderLoginForm(t: (k: string) => string): string {
  return `
    <div class="panel" id="loginSection">
      <h3 class="section-title" data-i18n="organisations.loginTitle">${t('organisations.loginTitle')}</h3>
      
      <div class="form-group">
        <label for="mobileNumber" data-i18n="organisations.mobileLabel">${t('organisations.mobileLabel')} <span class="required">*</span></label>
        <input type="tel" id="mobileNumber" placeholder="+91 98765 43210" maxlength="20">
        <span class="form-help">Enter your registered mobile number</span>
      </div>
      
      <button class="primary-button" id="sendOtp" type="button" data-i18n="organisations.sendOtp">${t('organisations.sendOtp')}</button>
      
      <div id="otpSection" hidden>
        <div class="form-group" style="margin-top: 20px;">
          <label for="otpInput" data-i18n="organisations.otpLabel">${t('organisations.otpLabel')} <span class="required">*</span></label>
          <input type="text" id="otpInput" placeholder="123456" maxlength="6" inputmode="numeric">
        </div>
        
        <button class="primary-button" id="verifyOtp" type="button" style="margin-top: 12px;" data-i18n="organisations.verifyOtp">${t('organisations.verifyOtp')}</button>
      </div>
    </div>
  `;
}

function renderDashboard(t: (k: string) => string): string {
  return `
    <div class="dashboard">
      <div class="dashboard-header">
        <h3 data-i18n="organisations.addLocation">${t('organisations.addLocation')}</h3>
        <button class="secondary-button" id="logoutBtn" type="button" data-i18n="organisations.logout">${t('organisations.logout')}</button>
      </div>
      
      <form class="panel donation-form" id="locationForm">
        <div class="form-grid">
          <div class="form-group">
            <label for="locationName" data-i18n="organisations.locationName">${t('organisations.locationName')} <span class="required">*</span></label>
            <input id="locationName" required maxlength="100" placeholder="e.g. Main Food Distribution Center">
          </div>
          
          <div class="form-group">
            <label for="contactPerson" data-i18n="organisations.contactPerson">${t('organisations.contactPerson')}</label>
            <input id="contactPerson" maxlength="100" placeholder="Contact person name">
          </div>
          
          <div class="form-group">
            <label for="addressLine1" data-i18n="organisations.addressLine1">${t('organisations.addressLine1')} <span class="required">*</span></label>
            <input id="addressLine1" required maxlength="200" placeholder="Street address, building name">
          </div>
          
          <div class="form-group">
            <label for="addressLine2" data-i18n="organisations.addressLine2">${t('organisations.addressLine2')}</label>
            <input id="addressLine2" maxlength="200" placeholder="Apartment, suite, floor (optional)">
          </div>
          
          <div class="form-group">
            <label for="city" data-i18n="organisations.city">${t('organisations.city')} <span class="required">*</span></label>
            <input id="city" required maxlength="100" placeholder="City">
          </div>
          
          <div class="form-group">
            <label for="state" data-i18n="organisations.state">${t('organisations.state')} <span class="required">*</span></label>
            <input id="state" required maxlength="100" placeholder="State/Province">
          </div>
          
          <div class="form-group">
            <label for="postalCode" data-i18n="organisations.postalCode">${t('organisations.postalCode')} <span class="required">*</span></label>
            <input id="postalCode" required maxlength="20" placeholder="Postal/ZIP code">
          </div>
          
          <div class="form-group">
            <label for="country" data-i18n="organisations.country">${t('organisations.country')}</label>
            <input id="country" maxlength="100" placeholder="Country" value="India">
          </div>
          
          <div class="form-group">
            <label for="contactPhone" data-i18n="organisations.contactPhone">${t('organisations.contactPhone')} <span class="required">*</span></label>
            <input id="contactPhone" type="tel" required maxlength="20" placeholder="Contact phone number">
          </div>
          
          <div class="form-group">
            <label for="contactEmail" data-i18n="organisations.contactEmail">${t('organisations.contactEmail')}</label>
            <input id="contactEmail" type="email" maxlength="100" placeholder="contact@ngo.org">
          </div>
          
          <div class="form-group full">
            <label for="donorLocation" data-i18n="organisations.useLocation">${t('organisations.useLocation')} <span class="required">*</span></label>
            <button class="secondary-button" id="getLocation" type="button" data-i18n="organisations.useLocation">${t('organisations.useLocation')}</button>
            <span class="form-help" id="locationStatus">Allow location access or enter coordinates above.</span>
          </div>
          
          <div class="form-group full" style="margin-top: 16px;">
            <label data-i18n="organisations.pickLocationOnMap">${t('organisations.pickLocationOnMap')}</label>
            <div id="locationMap" style="height: 250px; border-radius: 8px; border: 1px solid var(--border);"></div>
            <span class="form-help">Click on the map to set the location, or use "Use My Location" button above.</span>
          </div>
          
          <div class="form-group full">
            <label for="servicesOffered" data-i18n="organisations.servicesOffered">${t('organisations.servicesOffered')}</label>
            <select id="servicesOffered" multiple style="min-height: 120px;">
              <option value="food_pantry">Food Pantry</option>
              <option value="meal_service">Meal Service</option>
              <option value="food_bank">Food Bank</option>
              <option value="community_kitchen">Community Kitchen</option>
              <option value="mobile_distribution">Mobile Distribution</option>
              <option value="other">Other</option>
            </select>
            <span class="form-help">Hold Ctrl/Cmd to select multiple</span>
          </div>
          
          <div class="form-group full">
            <label for="operatingHours" data-i18n="organisations.operatingHours">${t('organisations.operatingHours')}</label>
            <textarea id="operatingHours" rows="4" placeholder='{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00", "saturday": "10:00-14:00", "sunday": "closed"}'></textarea>
            <span class="form-help">Enter as JSON. Use "closed" for closed days.</span>
          </div>
          
          <div class="form-group">
            <label for="personsHelped" data-i18n="organisations.personsHelped">${t('organisations.personsHelped')} <span class="required">*</span></label>
            <input id="personsHelped" type="number" min="0" max="1000000" step="1" placeholder="0" required>
          </div>
          
          <div class="form-group">
            <label for="serviceRadius" data-i18n="organisations.serviceRadius">${t('organisations.serviceRadius')}</label>
            <input id="serviceRadius" type="number" min="0" max="100" step="0.5" value="10" placeholder="10">
          </div>
        </div>
        
        <button class="primary-button" type="submit" data-i18n="organisations.saveLocation">${t('organisations.saveLocation')}</button>
      </form>
      
      <div class="locations-list" style="margin-top: 30px;">
        <h3 class="section-title" data-i18n="organisations.yourLocations">${t('organisations.yourLocations')}</h3>
        <div id="locationsList" class="message-list"></div>
      </div>
    </div>
  `;
}

function setupLoginForm(container: HTMLElement, t: (k: string) => string): void {
  const messageEl = container.querySelector('#orgMessage') as HTMLElement;
  const mobileInput = container.querySelector('#mobileNumber') as HTMLInputElement;
  const sendOtpBtn = container.querySelector('#sendOtp') as HTMLButtonElement;
  const otpSection = container.querySelector('#otpSection') as HTMLElement;
  const otpInput = container.querySelector('#otpInput') as HTMLInputElement;
  const verifyOtpBtn = container.querySelector('#verifyOtp') as HTMLButtonElement;

  let currentMobile = '';

  function showMessage(msg: string, isError = false) {
    messageEl.textContent = msg;
    messageEl.className = `form-message ${isError ? 'error' : 'success'} show`;
  }

  function hideMessage() {
    messageEl.classList.remove('show');
  }

  sendOtpBtn?.addEventListener('click', async () => {
    const mobile = mobileInput?.value?.trim();
    if (!mobile) {
      showMessage(t('organisations.mobileRequired'), true);
      return;
    }

    hideMessage();
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = t('organisations.sendOtp') + '...';

    const result = await ngoAuthManager.sendOtp(mobile);
    
    sendOtpBtn.disabled = false;
    sendOtpBtn.textContent = t('organisations.sendOtp');

    if (result.success) {
      currentMobile = mobile;
      otpSection.hidden = false;
      showMessage(t('organisations.otpSent'));
      otpInput?.focus();
    } else {
      showMessage(result.error || t('organisations.invalidOtp'), true);
    }
  });

  verifyOtpBtn?.addEventListener('click', async () => {
    const otp = otpInput?.value?.trim();
    if (!otp) {
      showMessage(t('organisations.otpRequired'), true);
      return;
    }

    hideMessage();
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = t('organisations.verifyOtp') + '...';

    const result = await ngoAuthManager.verifyOtp(currentMobile, otp);
    
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.textContent = t('organisations.verifyOtp');

    if (result.success) {
      showMessage(t('organisations.loginSuccess'));
      // Reload page to show dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showMessage(result.error || t('organisations.invalidOtp'), true);
    }
  });
}

function setupDashboard(container: HTMLElement, t: (k: string) => string): void {
  const messageEl = container.querySelector('#orgMessage') as HTMLElement;
  const logoutBtn = container.querySelector('#logoutBtn') as HTMLButtonElement;
  const locationForm = container.querySelector('#locationForm') as HTMLFormElement;
  const getLocationBtn = container.querySelector('#getLocation') as HTMLButtonElement;
  const locationStatus = container.querySelector('#locationStatus') as HTMLElement;
  const locationsList = container.querySelector('#locationsList') as HTMLElement;

  function showMessage(msg: string, isError = false) {
    messageEl.textContent = msg;
    messageEl.className = `form-message ${isError ? 'error' : 'success'} show`;
    setTimeout(hideMessage, 5000);
  }

  function hideMessage() {
    messageEl.classList.remove('show');
  }

  // Load existing locations
  loadLocations();

  // Logout handler
  logoutBtn?.addEventListener('click', () => {
    ngoAuthManager.logout();
    window.location.reload();
  });

  // Initialize location map
  let locationMap: L.Map | null = null;
  let locationMarker: L.Marker | null = null;

  function initLocationMap(): void {
    const mapContainer = container.querySelector('#locationMap') as HTMLElement;
    if (!mapContainer) return;

    // Default to India center
    const defaultLat = 20.5937;
    const defaultLng = 78.9629;

    locationMap = L.map('locationMap').setView([defaultLat, defaultLng], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(locationMap);

    // Handle map click to set location
    locationMap.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Update hidden inputs
      (container.querySelector('#latitude') as HTMLInputElement).value = lat.toFixed(6);
      (container.querySelector('#longitude') as HTMLInputElement).value = lng.toFixed(6);

      // Update or create marker
      if (locationMap) {
        if (locationMarker) {
          locationMarker.setLatLng([lat, lng]);
        } else {
          locationMarker = L.marker([lat, lng]).addTo(locationMap);
        }
      }

      locationStatus.textContent = `Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    });

    // Invalidate size after a short delay to ensure container is visible
    setTimeout(() => {
      locationMap?.invalidateSize();
    }, 100);
  }

  // Initialize map
  initLocationMap();

  // Get current location
  getLocationBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = 'Geolocation not supported';
      return;
    }

    locationStatus.textContent = 'Getting location...';
    getLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        (container.querySelector('#latitude') as HTMLInputElement).value = lat.toFixed(6);
        (container.querySelector('#longitude') as HTMLInputElement).value = lng.toFixed(6);
        
        // Update map marker
        if (locationMap && locationMarker) {
          locationMarker.setLatLng([lat, lng]);
          locationMap.setView([lat, lng], 15);
        } else if (locationMap) {
          locationMarker = L.marker([lat, lng]).addTo(locationMap);
          locationMap.setView([lat, lng], 15);
        }
        
        locationStatus.textContent = `Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        getLocationBtn.disabled = false;
      },
      (_error) => {
        locationStatus.textContent = 'Unable to get location. Please enter manually.';
        getLocationBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Form submit handler
  locationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileId = ngoAuthManager.getProfileId();
    if (!profileId) {
      showMessage('Not authenticated. Please log in again.', true);
      return;
    }

    // Get selected services
    const servicesSelect = container.querySelector('#servicesOffered') as HTMLSelectElement;
    const selectedServices = Array.from(servicesSelect.selectedOptions).map(opt => opt.value);

    // Parse operating hours
    let operatingHours: Record<string, string> = {};
    try {
      const hoursText = (container.querySelector('#operatingHours') as HTMLTextAreaElement).value;
      if (hoursText.trim()) {
        operatingHours = JSON.parse(hoursText);
      }
    } catch (e) {
      showMessage('Invalid operating hours JSON format', true);
      return;
    }

    const locationData: NgoLocationInsert = {
      ngo_id: profileId,
      location_name: (container.querySelector('#locationName') as HTMLInputElement)?.value.trim() ?? '',
      address_line1: (container.querySelector('#addressLine1') as HTMLInputElement)?.value.trim() ?? '',
      address_line2: (container.querySelector('#addressLine2') as HTMLInputElement)?.value.trim() ?? undefined,
      city: (container.querySelector('#city') as HTMLInputElement)?.value.trim() ?? '',
      state: (container.querySelector('#state') as HTMLInputElement)?.value.trim() ?? '',
      postal_code: (container.querySelector('#postalCode') as HTMLInputElement)?.value.trim() ?? '',
      latitude: parseFloat((container.querySelector('#latitude') as HTMLInputElement)?.value ?? '0'),
      longitude: parseFloat((container.querySelector('#longitude') as HTMLInputElement)?.value ?? '0'),
      contact_person: (container.querySelector('#contactPerson') as HTMLInputElement)?.value.trim() ?? undefined,
      contact_phone: (container.querySelector('#contactPhone') as HTMLInputElement)?.value.trim() ?? '',
      contact_email: (container.querySelector('#contactEmail') as HTMLInputElement)?.value.trim() ?? undefined,
      operating_hours: operatingHours,
      services_offered: selectedServices,
      capacity_description: undefined,
      persons_helped: parseInt((container.querySelector('#personsHelped') as HTMLInputElement)?.value ?? '0') || 0
    };

    // Validate required fields
    if (!locationData.location_name || !locationData.address_line1 || !locationData.city || 
        !locationData.state || !locationData.postal_code || isNaN(locationData.latitude) || isNaN(locationData.longitude) ||
        !locationData.contact_phone) {
      showMessage('Please fill all required fields', true);
      return;
    }

    const submitBtn = locationForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      await ngoLocationQueries.create(locationData);
      showMessage(t('organisations.locationSaved'));
      locationForm.reset();
      loadLocations();
    } catch (err: any) {
      console.error('Save location error:', err);
      showMessage(t('organisations.locationError'), true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('organisations.saveLocation');
    }
  });

  async function loadLocations(): Promise<void> {
    const profileId = ngoAuthManager.getProfileId();
    if (!profileId) return;

    try {
      const locations = await ngoLocationQueries.getByNgoId(profileId);
      
      if (locations.length === 0) {
        locationsList.innerHTML = `<p class="message" data-i18n="organisations.noLocations">${t('organisations.noLocations')}</p>`;
        return;
      }

      locationsList.innerHTML = locations.map((loc) => `
        <div class="message-card" style="margin-bottom: 20px;">
          <h3>${loc.location_name}</h3>
          <p>${loc.address_line1}${loc.address_line2 ? ', ' + loc.address_line2 : ''}, ${loc.city}, ${loc.state} ${loc.postal_code}</p>
          <p><strong>Contact:</strong> ${loc.contact_person || 'N/A'} - ${loc.contact_phone}${loc.contact_email ? ' / ' + loc.contact_email : ''}</p>
          <p><strong>Services:</strong> ${loc.services_offered?.join(', ') || 'None'}</p>
          <p><strong>Persons Helped:</strong> ${loc.persons_helped || 'Not specified'} | <strong>Radius:</strong> ${loc.service_radius_km} km</p>
          <p><strong>Coordinates:</strong> ${loc.latitude}, ${loc.longitude}</p>
          <div id="locationMap-${loc.id}" style="height: 150px; border-radius: 8px; border: 1px solid var(--border); margin-top: 10px;"></div>
        </div>
      `).join('');

      // Initialize mini maps for each location
      locations.forEach(loc => {
        const mapContainer = container.querySelector(`#locationMap-${loc.id}`) as HTMLElement;
        if (mapContainer && loc.latitude && loc.longitude) {
          const miniMap = L.map(`locationMap-${loc.id}`).setView([loc.latitude, loc.longitude], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(miniMap);
          L.marker([loc.latitude, loc.longitude]).addTo(miniMap);
          setTimeout(() => miniMap.invalidateSize(), 50);
        }
      });
    } catch (err) {
      console.error('Load locations error:', err);
      locationsList.innerHTML = `<p class="message error">Failed to load locations</p>`;
    }
  }
}