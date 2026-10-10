import { RouteMatch, PageConfig } from './types';

export class Router {
  private static instance: Router;
  private routes: PageConfig[] = [];
  private currentMatch: RouteMatch | null = null;

  private constructor() {
    window.addEventListener('hashchange', () => this.handleRoute());
    console.log('[Router] Constructor called, hashchange listener added');
  }

  public static getInstance(): Router {
    if (!Router.instance) Router.instance = new Router();
    return Router.instance;
  }

  register(config: PageConfig) {
    console.log('[Router] Registering route:', config.path);
    this.routes.push(config);
  }

  navigate(path: string, replace = false) {
    const formattedPath = path.startsWith('/') ? path : `/${path}`;
    console.log('[Router] Navigate to:', formattedPath);
    if (replace) {
      window.location.replace(`${window.location.origin}${window.location.pathname}#${formattedPath}`);
    } else {
      window.location.hash = formattedPath;
    }
  }

  private handleRoute() {
    // Normalize hash: #/donate -> /donate | empty -> /
    const hash = window.location.hash.slice(1) || '/';
    console.log('[Router] handleRoute called, hash:', hash);
    const match = this.matchRoute(hash);
    
    if (match) {
      console.log('[Router] Match found:', match.config.path);
      this.currentMatch = match;
      window.dispatchEvent(new CustomEvent('route-changed', { detail: match }));
    } else if (hash !== '/') {
      console.log('[Router] No match, redirecting to /');
      this.navigate('/'); // Fallback to home
    }
  }

  private matchRoute(url: string): RouteMatch | null {
    const [path, queryString] = url.split('?');
    const query: Record<string, string> = {};
    if (queryString) {
      new URLSearchParams(queryString).forEach((v, k) => query[k] = v);
    }

    for (const route of this.routes) {
      // Logic for /listing/:id matching
      const routeParts = route.path.split('/').filter(Boolean);
      const pathParts = path.split('/').filter(Boolean);

      if (routeParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      const isMatch = routeParts.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = pathParts[i];
          return true;
        }
        return part === pathParts[i];
      });

      if (isMatch) return { config: route, params, query };
    }
    return null;
  }

  start() {
    // Ensure initial load matches a route
    console.log('[Router] start() called, current hash:', window.location.hash);
    this.handleRoute();
  }

  getCurrentRoute() { return this.currentMatch; }
}