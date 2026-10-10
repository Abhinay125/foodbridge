import { messageQueries } from '@/modules/database';
import { I18nManager } from '@/modules/i18n';
import { formatMessageTime } from '@/utils';
import Fuse from 'fuse.js';

export class ConversationManager {
  private static instance: ConversationManager;
  private conversations: any[] = [];

  private constructor() {}

  public static getInstance(): ConversationManager {
    if (!this.instance) this.instance = new ConversationManager();
    return this.instance;
  }

  async loadConversations(container: HTMLElement, userId: string) {
    container.innerHTML = '<div class="skeleton-loader"></div>';
    this.conversations = await messageQueries.getConversations(userId);
    this.render(container);
  }

  render(container: HTMLElement, filter: string = '') {
    let displayList = this.conversations;

    if (filter) {
      const fuse = new Fuse(this.conversations, { keys: ['other_user_name', 'last_message'] });
      displayList = fuse.search(filter).map(r => r.item);
    }

    if (displayList.length === 0) {
      container.innerHTML = `<div class="empty-state">${I18nManager.getInstance().t('messages.noConversations')}</div>`;
      return;
    }

    container.innerHTML = displayList.map(c => `
      <div class="conversation-item" data-id="${c.id}" data-user-id="${c.other_user_id}">
        <div class="message-avatar">${c.other_user_name[0]}</div>
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="name">${c.other_user_name}</span>
            <span class="time">${formatMessageTime(c.updated_at)}</span>
          </div>
          <div class="last-message">${c.last_message || ''}</div>
        </div>
        ${c.unread_count > 0 ? `<span class="badge">${c.unread_count}</span>` : ''}
      </div>
    `).join('');
  }

  destroy() {
    this.conversations = [];
  }
}