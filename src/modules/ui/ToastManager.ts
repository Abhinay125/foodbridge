import { ToastType, ToastOptions } from './types';

export class ToastManager {
  private container!: HTMLElement;
  private initialized = false;

  constructor() {
    this.createContainer();
  }

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(message: string, type: ToastType = 'info', options?: ToastOptions): HTMLElement {
    const toast = document.createElement('div');
    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      max-width: 450px;
      pointer-events: auto;
      animation: toast-slide-in 0.3s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.5;
    `;

    const colors: Record<ToastType, { bg: string; text: string; icon: string }> = {
      success: { bg: '#16834a', text: '#fff', icon: '✓' },
      error: { bg: '#d93838', text: '#fff', icon: '✕' },
      info: { bg: '#16834a', text: '#fff', icon: 'ℹ' },
      warning: { bg: '#e67e22', text: '#fff', icon: '⚠' }
    };

    const { bg, text, icon } = colors[type];
    toast.style.backgroundColor = bg;
    toast.style.color = text;

    const iconEl = document.createElement('span');
    iconEl.style.cssText = `
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
    `;
    iconEl.textContent = icon;

    const messageEl = document.createElement('span');
    messageEl.style.cssText = 'flex: 1;';
    messageEl.textContent = message;

    toast.appendChild(iconEl);
    toast.appendChild(messageEl);

    if (options?.action) {
      const actionBtn = document.createElement('button');
      actionBtn.textContent = options.action.label;
      actionBtn.style.cssText = `
        flex-shrink: 0;
        padding: 6px 12px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
        color: inherit;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      `;
      actionBtn.addEventListener('mouseenter', () => {
        actionBtn.style.background = 'rgba(255, 255, 255, 0.3)';
      });
      actionBtn.addEventListener('mouseleave', () => {
        actionBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      });
      actionBtn.addEventListener('click', () => {
        options.action!.onClick();
        this.dismiss(toast);
      });
      toast.appendChild(actionBtn);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.15);
      color: inherit;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.25)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.15)';
    });
    closeBtn.addEventListener('click', () => this.dismiss(toast));
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);

    const duration = options?.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    // Add keyframe animation if not already added
    if (!document.getElementById('toast-animations')) {
      const style = document.createElement('style');
      style.id = 'toast-animations';
      style.textContent = `
        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes toast-slide-out {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    return toast;
  }

  private dismiss(toast: HTMLElement): void {
    toast.style.animation = 'toast-slide-out 0.3s ease-in forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  success(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'success', options);
  }

  error(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'error', options);
  }

  info(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'info', options);
  }

  warning(message: string, options?: ToastOptions): HTMLElement {
    return this.show(message, 'warning', options);
  }

  clear(): void {
    const toasts = this.container.querySelectorAll('div');
    toasts.forEach(toast => this.dismiss(toast as HTMLElement));
  }
}