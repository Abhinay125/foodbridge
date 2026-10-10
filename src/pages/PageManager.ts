import { PageContext, RouteMatch } from './types';
import { UIManager } from '@/modules/ui';

export class PageManager {
  private static instance: PageManager;
  private container: HTMLElement | null = null;
  private currentRoute: RouteMatch | null = null;

  private constructor() {}

  public static getInstance(): PageManager {
    if (!PageManager.instance) PageManager.instance = new PageManager();
    return PageManager.instance;
  }

  initialize(containerId: string) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`Container #${containerId} not found`);
    console.log('[PageManager] Initialized with container:', containerId);
    
    window.addEventListener('route-changed', (e: any) => {
      console.log('[PageManager] route-changed event received:', e.detail?.config?.path);
      this.renderPage(e.detail);
    });
  }

  private async renderPage(match: RouteMatch) {
    if (!this.container) return;

    console.log('[PageManager] renderPage called for:', match.config.path);

    // 2. Lifecycle: Leave previous page
    if (this.currentRoute) {
      try {
        await this.currentRoute.config.onLeave?.();
        this.currentRoute.config.destroy();
      } catch (e) { console.warn('Cleanup error:', e); }
    }

    UIManager.getInstance().loading.show();

    try {
      // 3. Render and Initialize
      this.container.innerHTML = ''; 
      const context: PageContext = { params: match.params, query: match.query };
      
      await match.config.onEnter?.(context);
      await match.config.init(this.container, context);
      
      this.currentRoute = match;
      this.updateSidebarUI(match.config.path);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Routing Error:', error);
      UIManager.getInstance().toast.error('Page failed to load');
    } finally {
      UIManager.getInstance().loading.hide();
    }
  }

  private updateSidebarUI(activePath: string) {
    document.querySelectorAll('.nav button').forEach(btn => {
      const btnPage = btn.getAttribute('data-page'); // e.g. "donate"
      // Match #/donate to data-page="donate"
      // Special case: home page path "/" should match data-page="home"
      const isActive = btnPage === 'home' 
        ? activePath === '/' 
        : activePath.includes(btnPage || '___');
      btn.classList.toggle('active', isActive);
    });
  }
}