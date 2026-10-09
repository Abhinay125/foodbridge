/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_LEAFLET_CSS_URL: string;
  readonly VITE_MAP_DEFAULT_CENTER_LAT: string;
  readonly VITE_MAP_DEFAULT_CENTER_LNG: string;
  readonly VITE_MAP_DEFAULT_ZOOM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Leaflet types
declare module 'leaflet' {
  export * from 'leaflet';
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}