import { PageConfig } from './types';
import { FoodFormManager } from '@/modules/food';
import { UIManager } from '@/modules/ui';

export const DonatePage: PageConfig = {
  path: '/donate',
  title: 'food.donate',
  init: async (container) => {
    container.innerHTML = `
      <section class="page active" id="donatePage">
        <button class="back-button" type="button" data-back>
          ← <span data-i18n="backHome">Back to Home</span>
        </button>
        <h2 class="section-title" data-i18n="donateHeading">Donate Food 💚</h2>
        <p class="section-description" data-i18n="donateDescription">
          Add your surplus food. Required fields are marked with *.
        </p>
        <div id="donate-content"></div>
      </section>
    `;

    // Set up back button handler
    const backButton = container.querySelector('[data-back]') as HTMLButtonElement;
    if (backButton) {
      backButton.addEventListener('click', () => {
        window.history.back();
      });
    }

    const content = container.querySelector('#donate-content') as HTMLElement;
    FoodFormManager.getInstance().initialize(content, {
      mode: 'create',
      onSuccess: () => {
        // Show success message and reset form
        UIManager.getInstance().toast.success('Food listing created successfully!');
        FoodFormManager.getInstance().destroy();
        const newContent = container.querySelector('#donate-content') as HTMLElement;
        FoodFormManager.getInstance().initialize(newContent, {
          mode: 'create',
          onSuccess: () => UIManager.getInstance().toast.success('Food listing created successfully!'),
          onError: (err) => console.error(err)
        });
      },
      onError: (err) => console.error(err)
    });
  },
  destroy: () => FoodFormManager.getInstance().destroy()
};