import { ModalOptions, ModalResult } from './types';

export class ModalManager {
  private currentModal: HTMLElement | null = null;
  private resolveFn: ((result: ModalResult) => void) | null = null;
  private escapeHandler: ((event: KeyboardEvent) => void) | null = null;
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  show(content: string | HTMLElement, options: ModalOptions = {}): Promise<ModalResult> {
    return new Promise((resolve) => {
      this.resolveFn = resolve;

      const {
        title,
        size = 'md',
        closable = true,
        onClose
      } = options;

      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        animation: modal-fade-in 0.2s ease-out;
        padding: 20px;
      `;

      // Create modal container
      const modal = document.createElement('div');
      const sizes = {
        sm: '400px',
        md: '500px',
        lg: '700px'
      };
      modal.style.cssText = `
        width: 100%;
        max-width: ${sizes[size]};
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        animation: modal-slide-up 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        overflow: hidden;
      `;

      // Build modal content
      let modalHTML = '';

      if (title) {
        modalHTML += `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 24px;
            border-bottom: 1px solid #e6ebe7;
          ">
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 650;
              color: #202520;
            ">${this.escapeHtml(title)}</h3>
          </div>
        `;
      }

      modalHTML += `
        <div style="padding: 24px;">
          ${typeof content === 'string' ? content : ''}
        </div>
      `;

      // Add footer with buttons for confirm/alert
      const hasButtons = options && (options as any)._showButtons !== false;
      if (hasButtons) {
        const isConfirm = (options as any)._isConfirm;
        const isAlert = (options as any)._isAlert;

        let buttonsHTML = '<div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">';

        if (isConfirm) {
          buttonsHTML += `
            <button id="modal-cancel" style="
              padding: 11px 20px;
              border: 1px solid #e6ebe7;
              border-radius: 12px;
              background: white;
              color: #202520;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
            ">Cancel</button>
            <button id="modal-confirm" style="
              padding: 11px 20px;
              border: none;
              border-radius: 12px;
              background: #16834a;
              color: white;
              font-weight: 650;
              font-size: 14px;
              cursor: pointer;
              transition: background 0.2s;
            ">Confirm</button>
          `;
        } else if (isAlert) {
          buttonsHTML += `
            <button id="modal-ok" style="
              padding: 11px 20px;
              border: none;
              border-radius: 12px;
              background: #16834a;
              color: white;
              font-weight: 650;
              font-size: 14px;
              cursor: pointer;
              transition: background 0.2s;
            ">OK</button>
          `;
        }

        buttonsHTML += '</div>';
        modalHTML += buttonsHTML;
      }

      modal.innerHTML = modalHTML;

      // Add custom content if it's an HTMLElement
      if (content instanceof HTMLElement) {
        const contentDiv = modal.querySelector('div[style*="padding: 24px"]');
        if (contentDiv) {
          contentDiv.innerHTML = '';
          contentDiv.appendChild(content);
        }
      }

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      this.currentModal = overlay;

      // Add animations
      this.addAnimations();

      // Handle ESC key
      this.escapeHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && closable) {
          this.hide({ confirmed: false });
        }
      };
      document.addEventListener('keydown', this.escapeHandler);

      // Handle backdrop click
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay && closable) {
          this.hide({ confirmed: false });
        }
      });

      // Handle buttons
      const confirmBtn = modal.querySelector('#modal-confirm') as HTMLButtonElement;
      const cancelBtn = modal.querySelector('#modal-cancel') as HTMLButtonElement;
      const okBtn = modal.querySelector('#modal-ok') as HTMLButtonElement;

      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => this.hide({ confirmed: true }));
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => this.hide({ confirmed: false }));
      }
      if (okBtn) {
        okBtn.addEventListener('click', () => this.hide({ confirmed: true }));
      }

      // Store onClose callback
      (overlay as any)._onClose = onClose;
    });
  }

  private addAnimations(): void {
    if (!document.getElementById('modal-animations')) {
      const style = document.createElement('style');
      style.id = 'modal-animations';
      style.textContent = `
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes modal-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modal-slide-down {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  hide(result?: ModalResult): void {
    if (!this.currentModal) return;

    const modal = this.currentModal.querySelector('div[style*="max-width"]') as HTMLElement;
    const overlay = this.currentModal;

    if (modal) {
      modal.style.animation = 'modal-slide-down 0.2s ease-in forwards';
    }
    overlay.style.animation = 'modal-fade-out 0.2s ease-in forwards';

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      this.currentModal = null;

      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
        this.escapeHandler = null;
      }

      const onClose = (overlay as any)._onClose;
      if (onClose) {
        onClose();
      }

      if (this.resolveFn && result) {
        this.resolveFn(result);
        this.resolveFn = null;
      }
    }, 200);
  }

  confirm(message: string, options: ModalOptions = {}): Promise<boolean> {
    return this.show(message, {
      ...options,
      _isConfirm: true,
      _showButtons: true
    } as any).then(result => result.confirmed);
  }

  alert(message: string, options: ModalOptions = {}): Promise<void> {
    return this.show(message, {
      ...options,
      _isAlert: true,
      _showButtons: true
    } as any).then(() => {});
  }
}