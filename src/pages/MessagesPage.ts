import { PageConfig } from './types';
import { ConversationManager, MessageThreadManager } from '@/modules/messages';
import { I18nManager } from '@/modules/i18n';

export const MessagesPage: PageConfig = {
  path: '/messages',
  title: 'messages.title',
  init: async (container) => {
    const t = (k: string) => I18nManager.getInstance().t(k);
    
    container.innerHTML = `
      <div class="messages-page">
        <header class="page-header">
          <h1>${t('messages.title')}</h1>
        </header>
        
        <div class="messages-container">
          <aside class="conversations-sidebar" id="conversations-sidebar">
            <div class="sidebar-header">
              <input type="text" id="conversation-search" class="search-input" placeholder="${t('messages.searchPlaceholder')}" data-i18n-placeholder="messages.searchPlaceholder">
            </div>
            <div id="conversations-list" class="conversations-list"></div>
          </aside>
          
          <main class="message-thread" id="message-thread">
            <div class="thread-placeholder">
              <div class="message-avatar large">💬</div>
              <h2>${t('messages.selectConversation')}</h2>
              <p>${t('messages.selectConversationDesc')}</p>
            </div>
          </main>
        </div>
      </div>
    `;

    const conversationsList = container.querySelector('#conversations-list') as HTMLElement;

    // For anonymous users, show a simple message
    conversationsList.innerHTML = `<div class="empty-state">${t('messages.needLogin')}</div>`;
  },
  destroy: () => {
    ConversationManager.getInstance().destroy();
    MessageThreadManager.getInstance().destroy();
  }
};