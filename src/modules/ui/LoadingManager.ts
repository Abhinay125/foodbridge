export class LoadingManager {
  private overlay: HTMLElement | null = null;
  private inlineLoaders: Map<string, HTMLElement> = new Map();
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
  }

  show(message?: string, fullscreen: boolean = true): void {
    if (fullscreen) {
      this.showFullscreen(message);
    }
  }

  private showFullscreen(message?: string): void {
    if (this.overlay) return; // Already showing

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10002;
      animation: loading-fade-in 0.2s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 48px;
      height: 48px;
      border: 4px solid #e6ebe7;
      border-top-color: #16834a;
      border-radius: 50%;
      animation: loading-spin 1s linear infinite;
    `;

    this.overlay.appendChild(spinner);

    if (message) {
      const messageEl = document.createElement('p');
      messageEl.textContent = message;
      messageEl.style.cssText = `
        margin-top: 16px;
        font-size: 15px;
        color: #727a74;
        font-weight: 500;
      `;
      this.overlay.appendChild(messageEl);
    }

    document.body.appendChild(this.overlay);
    this.addAnimations();
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.style.animation = 'loading-fade-out 0.2s ease-in forwards';
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = null;
      }, 200);
    }
  }

  showInline(elementId: string, message?: string): void {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element with id "${elementId}" not found for inline loader`);
      return;
    }

    // Check if already has a loader
    if (this.inlineLoaders.has(elementId)) return;

    const loader = document.createElement('div');
    loader.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      gap: 12px;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid #e6ebe7;
      border-top-color: #16834a;
      border-radius: 50%;
      animation: loading-spin 1s linear infinite;
    `;

    loader.appendChild(spinner);

    if (message) {
      const messageEl = document.createElement('p');
      messageEl.textContent = message;
      messageEl.style.cssText = `
        margin: 0;
        font-size: 13px;
        color: #727a74;
      `;
      loader.appendChild(messageEl);
    }

    // Store original content and replace
    (element as any)._originalContent = element.innerHTML;
    element.innerHTML = '';
    element.appendChild(loader);
    element.style.minHeight = '100px';

    this.inlineLoaders.set(elementId, loader);
    this.addAnimations();
  }

  hideInline(elementId: string): void {
    const element = document.getElementById(elementId);
    const loader = this.inlineLoaders.get(elementId);

    if (element && loader) {
      // Restore original content
      const originalContent = (element as any)._originalContent;
      if (originalContent !== undefined) {
        element.innerHTML = originalContent;
      } else {
        element.innerHTML = '';
      }
      element.style.minHeight = '';

      this.inlineLoaders.delete(elementId);
    }
  }

  private addAnimations(): void {
    if (!document.getElementById('loading-animations')) {
      const style = document.createElement('style');
      style.id = 'loading-animations';
      style.textContent = `
        @keyframes loading-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes loading-fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes loading-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
}