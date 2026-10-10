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
  export class Map {
    constructor(id: string | HTMLElement, options?: any);
    setView(center: LatLngExpression, zoom: number, options?: { animate?: boolean }): this;
    on(event: string, handler: (e: any) => void, context?: any): this;
    remove(): this;
    hasLayer(layer: any): boolean;
    getBounds(): LatLngBounds;
    getZoom(): number;
    fitBounds(bounds: LatLngBoundsExpression, options?: any): this;
    invalidateSize(): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    project(latlng: LatLngExpression, zoom: number): Point;
  }
  export class Marker {
    constructor(latlng: [number, number], options?: any);
    setLatLng(latlng: [number, number]): this;
    addTo(map: Map): this;
    remove(): this;
    bindPopup(html: string): this;
    openPopup(): this;
    on(event: string, handler: (e: any) => void): this;
    options: { title?: string };
  }
  export class DivIcon {
    constructor(options: any);
  }
  export class LayerGroup {
    addTo(map: Map): this;
    clearLayers(): this;
  }
  export class Layer {
    addTo(map: Map): this;
    remove(): this;
  }
  export class LatLngBounds {
    extend(latlng: LatLngExpression): this;
    getCenter(): LatLng;
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
  }
  export class LatLng {
    constructor(lat: number, lng: number, alt?: number);
    lat: number;
    lng: number;
    equals(other: LatLng): boolean;
  }
  export class Point {
    constructor(x: number, y: number, round?: boolean);
    x: number;
    y: number;
  }
  export class Control {
    constructor(options?: any);
    addTo(map: Map): this;
    remove(): this;
    getPosition(): string;
    setPosition(position: string): this;
  }
  export class ZoomControl extends Control {
    constructor(options?: any);
  }
  export class ScaleControl extends Control {
    constructor(options?: any);
  }
  // control namespace for plugins (locatecontrol, search, etc.)
  export namespace control {
    export function zoom(options?: any): ZoomControl;
    export function scale(options?: any): ScaleControl;
    export function locate(options?: any): any; // from leaflet.locatecontrol
    export function search(options?: any): any; // from leaflet-search
  }
  export function map(id: string | HTMLElement, options?: any): Map;
  export function marker(latlng: [number, number], options?: any): Marker;
  export function tileLayer(url: string, options?: any): any;
  export function divIcon(options: any): DivIcon;
  export function layerGroup(layers?: any[]): LayerGroup;
  export function latLng(lat: number, lng: number): LatLng;
  export function latLngBounds(southWest: LatLngExpression, northEast: LatLngExpression): LatLngBounds;
  export function point(x: number, y: number, round?: boolean): Point;
  export interface LeafletMouseEvent {
    latlng: LatLng;
    containerPoint: Point;
    layerPoint: Point;
  }
  export type LatLngExpression = LatLng | [number, number] | { lat: number; lng: number };
  export type LatLngBoundsExpression = LatLngBounds | LatLngExpression[] | [number, number][][];
}

// Leaflet plugin types
declare module 'leaflet.markercluster' {
  import L from 'leaflet';
  export interface MarkerClusterGroupOptions {
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    iconCreateFunction?: (cluster: any) => L.DivIcon;
  }
  export class MarkerClusterGroup extends L.LayerGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    getChildCount(): number;
  }
  export function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

declare module 'leaflet.heat' {
  import L from 'leaflet';
  export interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    gradient?: Record<number, string>;
  }
  export class HeatLayer extends L.Layer {
    constructor(latLngs: [number, number, number][], options?: HeatLayerOptions);
    setLatLngs(latLngs: [number, number, number][]): this;
    addTo(map: L.Map): this;
    remove(): this;
  }
  export function heatLayer(latLngs: [number, number, number][], options?: HeatLayerOptions): HeatLayer;
}

declare module 'leaflet.locatecontrol' {
  import L from 'leaflet';
  export interface LocateControlOptions {
    position?: string;
    strings?: { title: string };
    locateOptions?: { enableHighAccuracy: boolean };
  }
  export class LocateControl extends L.Control {
    constructor(options?: LocateControlOptions);
    addTo(map: L.Map): this;
  }
  export function control(options?: LocateControlOptions): LocateControl;
}

declare module 'leaflet-search' {
  import L from 'leaflet';
  export interface SearchControlOptions {
    layer?: L.LayerGroup;
    propertyName?: string;
    initial?: boolean;
    marker?: L.Marker;
    moveToLocation?: (latlng: any, title: string, map: L.Map) => void;
  }
  export class SearchControl extends L.Control {
    constructor(options?: SearchControlOptions);
    addTo(map: L.Map): this;
  }
  export function control(options?: SearchControlOptions): SearchControl;
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