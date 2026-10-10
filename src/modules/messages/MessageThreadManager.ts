import { messageQueries, supabaseClient } from '@/modules/database';
import { I18nManager } from '@/modules/i18n';
import { UIManager } from '@/modules/ui';
import { formatMessageTime, sanitizeHTML } from '@/utils';
import { MessageManager } from './MessageManager';
import { AttachmentManager } from './AttachmentManager';
import type { MessageThreadOptions, MessageWithSender } from './types';

export class MessageThreadManager {
  private static instance: MessageThreadManager;
  private container: HTMLElement | null = null;
  private options: MessageThreadOptions | null = null;
  private messages: MessageWithSender[] = [];
  private subscription: any;

  private constructor() {}

  public static getInstance(): MessageThreadManager {
    if (!this.instance) this.instance = new MessageThreadManager();
    return this.instance;
  }

  initialize(container: HTMLElement, options: MessageThreadOptions) {
    this.container = container;
    this.options = options;
    this.render();
    this.loadMessages();
    this.subscribe();
    this.attachEvents();
  }

  private render() {
    if (!this.container || !this.options) return;
    const t = (k: string) => I18nManager.getInstance().t(k);
    
    this.container.innerHTML = `
      <div class="message-thread">
        <header class="thread-header">
          <button class="btn btn--icon" id="back-btn">←</button>
          <div class="thread-user-info">
            <div class="message-avatar">${this.options.otherUserName[0]}</div>
            <div>
              <span class="name">${this.options.otherUserName}</span>
              <span class="status">Online</span>
            </div>
          </div>
          <div class="thread-actions">
            <button class="btn btn--icon" id="call-btn">📞</button>
            <button class="btn btn--icon" id="info-btn">ℹ️</button>
          </div>
        </header>
        
        <div class="message-list" id="message-list">
          <div class="skeleton-loader"></div>
        </div>
        
        <form class="message-input-form" id="message-form">
          <div class="input-wrapper">
            <button type="button" class="btn btn--icon" id="attach-btn">📎</button>
            <input type="text" name="message" placeholder="${t('messages.typeMessage')}" autocomplete="off">
            <button type="button" class="btn btn--icon" id="emoji-btn">😀</button>
            <button type="button" class="btn btn--icon" id="location-btn">📍</button>
            <button type="button" class="btn btn--icon" id="voice-btn">🎤</button>
          </div>
          <div id="attachments-preview" class="attachments-preview"></div>
          <button type="submit" class="btn btn--primary">${t('messages.send')}</button>
        </form>
      </div>`;
  }

  private async loadMessages() {
    if (!this.options) return;
    try {
      // For anonymous access, we use a placeholder user ID
      const response = await messageQueries.getConversation(
        'anonymous',
        this.options.otherUserId
      );
      this.messages = response.data;
      this.renderMessages();
    } catch (err) {
      UIManager.getInstance().toast.error('Failed to load messages');
    }
  }

  private renderMessages() {
    if (!this.container) return;
    const list = this.container.querySelector('#message-list');
    const currentUserId = 'anonymous';
    
    if (!list) return;
    
    list.innerHTML = this.messages.map((msg, i) => {
      const isOwn = msg.sender_id === currentUserId;
      const showAvatar = i === 0 || this.messages[i - 1].sender_id !== msg.sender_id;
      const showTime = i === this.messages.length - 1 || this.messages[i + 1].sender_id !== msg.sender_id;
      
      return this.renderMessageBubble({
        message: msg,
        isOwn,
        showAvatar,
        showTime,
        showStatus: isOwn
      });
    }).join('');
    
    list.scrollTop = list.scrollHeight;
  }

  private renderMessageBubble(props: {
    message: MessageWithSender;
    isOwn: boolean;
    showAvatar: boolean;
    showTime: boolean;
    showStatus: boolean;
  }): string {
    const { message, isOwn, showAvatar, showTime, showStatus } = props;
    const t = (k: string) => I18nManager.getInstance().t(k);
    const sanitized = sanitizeHTML(message.message_text);
    
    return `
      <div class="message-bubble ${isOwn ? 'own' : ''}" data-id="${message.id}">
        ${showAvatar ? `<div class="message-avatar">${message.sender_name[0]}</div>` : '<div class="avatar-spacer"></div>'}
        <div class="message-content">
          <div class="message-bubble-inner">
            ${message.message_type === 'image' && message.attachment_urls?.[0] 
              ? `<img src="${message.attachment_urls[0]}" class="message-image" />`
              : message.message_type === 'location' && message.attachment_urls?.[0]
              ? `<a href="${message.attachment_urls[0]}" target="_blank" class="message-location">📍 ${t('messages.locationShared')}</a>`
              : sanitized}
          </div>
          ${showTime ? `<span class="message-time">${formatMessageTime(message.created_at)}</span>` : ''}
          ${showStatus && isOwn ? `<span class="message-status">${message.is_read ? '✓✓' : '✓'}</span>` : ''}
        </div>
      </div>`;
  }

  private subscribe() {
    if (!this.options) return;
    this.subscription = supabaseClient.client
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(sender_id.eq.${this.options.otherUserId},recipient_id.eq.${this.options.otherUserId})`
      }, (payload) => {
        if (payload.new) {
          this.messages.push(payload.new as MessageWithSender);
          this.renderMessages();
        }
      })
      .subscribe();
  }

  private attachEvents() {
    if (!this.container || !this.options) return;
    
    const form = this.container.querySelector('#message-form') as HTMLFormElement;
    const backBtn = this.container.querySelector('#back-btn') as HTMLButtonElement;
    const attachBtn = this.container.querySelector('#attach-btn') as HTMLButtonElement;
    
    backBtn?.addEventListener('click', () => this.options?.onBack());
    
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[name="message"]') as HTMLInputElement;
      const text = input.value.trim();
      if (!text) return;
      
      await MessageManager.getInstance().sendMessage({
        recipient_id: this.options!.otherUserId,
        message_text: text,
        message_type: 'text'
      });
      
      input.value = '';
    });
    
    attachBtn?.addEventListener('click', () => {
      // Open file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          const url = await AttachmentManager.getInstance().upload(file, 'anonymous');
          await MessageManager.getInstance().sendMessage({
            recipient_id: this.options!.otherUserId,
            message_text: '',
            message_type: 'image',
            attachment_urls: [url]
          });
        }
      };
      input.click();
    });
  }

  destroy() {
    if (this.subscription) this.subscription.unsubscribe();
    this.container = null;
    this.options = null;
    this.messages = [];
  }
}