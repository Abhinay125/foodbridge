import { PageConfig } from './types';
import { foodListingQueries } from '@/modules/database';
import { I18nManager } from '@/modules/i18n';
import { Router } from './Router';
import { UIManager } from '@/modules/ui';

export const FoodPage: PageConfig = {
  path: '/food',
  title: 'food.title',
  init: async (container, context) => {
    const i18n = I18nManager.getInstance();
    const t = (k: string, params?: Record<string, any>) => i18n.t(k, params);
    const ui = UIManager.getInstance();

    // Get category from URL query param (Veg/Non-Veg)
    const category = context.query.category || 'Veg';
    
    // Get recipient location from localStorage for distance calculation
    let recipientLocation: { lat: number; lng: number } | null = null;
    try {
      const stored = localStorage.getItem('foodbridge_recipient_location');
      if (stored) recipientLocation = JSON.parse(stored);
    } catch {}

    container.innerHTML = `
      <div class="food-page">
        <button class="back-button" type="button" data-back>
          ← <span data-i18n="backHome">${t('backHome')}</span>
        </button>

        <h2 class="section-title" id="foodPageTitle">${t('food.availableDonations')}</h2>

        <p class="section-description" id="foodPageDescription">
          ${t('food.exploreDescription')}
        </p>

        <div class="food-grid" id="foodGrid"></div>

        <p class="message" id="foodPageMessage" role="status"></p>
      </div>
    `;

    const foodGrid = container.querySelector('#foodGrid') as HTMLElement;
    const foodPageTitle = container.querySelector('#foodPageTitle') as HTMLElement;
    const foodPageMessage = container.querySelector('#foodPageMessage') as HTMLElement;
    const backButton = container.querySelector('[data-back]') as HTMLButtonElement;

    // Set page title based on category
    foodPageTitle.textContent = category === 'Veg' 
      ? '🥦 Available Vegetarian Food' 
      : '🍗 Available Non-Vegetarian Food';

    // Back button handler
    backButton?.addEventListener('click', () => {
      Router.getInstance().navigate('/');
    });

    // Distance calculation helper
    function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const toRadians = (value: number) => value * Math.PI / 180;
      const R = 6371;

      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function getDistanceText(food: any): string {
      if (
        recipientLocation &&
        Number.isFinite(Number(food.pickup_latitude)) &&
        Number.isFinite(Number(food.pickup_longitude))
      ) {
        const distance = distanceKm(
          recipientLocation.lat,
          recipientLocation.lng,
          Number(food.pickup_latitude),
          Number(food.pickup_longitude)
        );
        return `📍 ${distance.toFixed(1)} km from your location`;
      }
      return food.pickup_city 
        ? `📍 ${food.pickup_city}${food.pickup_state ? ', ' + food.pickup_state : ''}`
        : '📍 Location unavailable';
    }

    function isFoodAvailable(food: any): boolean {
      return food.status === 'available' &&
             new Date(food.available_until) > new Date() &&
             (food.estimated_servings || 0) > 0;
    }

    function safeImageUrl(url: string): string {
      if (!url || typeof url !== 'string') return '';
      if (!/^https?:\/\//i.test(url) && !url.startsWith('data:image/')) {
        return '';
      }
      return url;
    }

    // Render food cards
    async function renderFood() {
      foodGrid.innerHTML = '';
      foodPageMessage.textContent = '';

      try {
        // Build filters for Supabase query
        const filters: any = {
          food_type: category === 'Veg' ? 'prepared_food' : 'prepared_food', // We'll filter veg/non-veg differently
          is_vegetarian: category === 'Veg'
        };

        // If category is Non-Veg, we need to filter for non-vegetarian
        if (category === 'Non-Veg') {
          filters.is_vegetarian = false;
        }

        const res = await foodListingQueries.getAvailable(filters, 1, 20);
        const foods = res.data;

        if (foods.length === 0) {
          foodPageMessage.textContent = category === 'Veg' 
            ? 'No vegetarian food listings available at the moment.'
            : 'No non-vegetarian food listings available at the moment.';
          return;
        }

        foodPageMessage.textContent = 'Please verify the food condition, pickup time and address with the donor.';

        foods.forEach((food: any) => {
          const card = document.createElement('article');
          card.className = 'food-card';

          const image = document.createElement('img');
          image.className = 'food-image';
          const imgUrl = safeImageUrl(food.image_urls?.[0] || '');
          image.src = imgUrl || 'https://via.placeholder.com/400x190?text=No+Image';
          image.alt = food.title || 'Food donation';
          image.loading = 'lazy';
          image.style.background = 'var(--light-green)';

          image.addEventListener('error', () => {
            image.removeAttribute('src');
            image.alt = 'Food photo unavailable';
            image.style.display = 'none';
          });

          const details = document.createElement('div');
          details.className = 'food-details';

          const name = document.createElement('h3');
          name.textContent = food.title;

          const donor = document.createElement('p');
          donor.className = 'hotel-name';
          donor.textContent = '🏨 ' + (food.profiles?.full_name || food.donor_id || 'Food donor');

          const distance = document.createElement('p');
          distance.className = 'food-distance';
          distance.textContent = getDistanceText(food);

          const quantity = document.createElement('p');
          quantity.className = 'food-quantity';
          quantity.textContent = '🍱 ' + (food.estimated_servings || 1) + ' servings';

          const status = document.createElement('span');
          status.className = 'food-status';
          const available = isFoodAvailable(food);
          status.textContent = available ? 'Available' : 'Not available';
          if (!available) status.classList.add('unavailable');

          const button = document.createElement('button');
          button.className = 'food-card-button';
          button.type = 'button';
          button.textContent = available ? 'I Need This Food' : 'Unavailable';
          button.disabled = !available;

          button.addEventListener('click', () => {
            // Open request flow - navigate to pickup request page or open modal
            Router.getInstance().navigate(`/request?listing=${food.id}`);
          });

          const infoButton = document.createElement('button');
          infoButton.className = 'secondary-button';
          infoButton.type = 'button';
          infoButton.textContent = 'View Details';
          infoButton.addEventListener('click', () => {
            Router.getInstance().navigate(`/food/${food.id}`);
          });

          details.appendChild(name);
          details.appendChild(donor);
          details.appendChild(distance);
          details.appendChild(quantity);
          details.appendChild(status);
          details.appendChild(button);
          details.appendChild(infoButton);

          card.appendChild(image);
          card.appendChild(details);
          foodGrid.appendChild(card);
        });
      } catch (err) {
        console.error('Failed to load food listings:', err);
        foodPageMessage.textContent = 'Failed to load food listings. Please try again.';
        ui.toast.error('Load failed');
      }
    }

    // Initial render
    await renderFood();
  },
  destroy: () => {}
};