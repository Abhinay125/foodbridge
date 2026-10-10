export interface PageConfig {
  path: string;                    // Hash route: '#/donate', '#/map'
  title: string;                   // i18n key
  init: (container: HTMLElement, context: PageContext) => Promise<void> | void;
  destroy: () => void;
  onEnter?: (context: PageContext) => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
}

export interface PageContext {
  params: RouteParams;
  query: Record<string, string>;
}

export interface RouteParams {
  [key: string]: string;           // e.g., { id: '123' } for '#/listing/123'
}

export interface RouteMatch {
  config: PageConfig;
  params: RouteParams;
  query: Record<string, string>;
}