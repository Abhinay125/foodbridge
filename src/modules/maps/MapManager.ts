import L from 'leaflet';
import { MAP_CONFIG } from '@/config/maps';
import { MarkerManager } from './MarkerManager';
import { LayerManager } from './LayerManager';
import { MapUIManager } from './MapUIManager';
import type { MapManagerOptions, MapEvents } from './types';

export class MapManager {
  private static instance: MapManager;
  private map: L.Map | null = null;
  private events: MapEvents = {};
  private resizeObserver: ResizeObserver | null = null;

  private constructor() {}

  public static getInstance(): MapManager {
    if (!MapManager.instance) {
      MapManager.instance = new MapManager();
    }
    return MapManager.instance;
  }

  public initialize(options: MapManagerOptions, events: MapEvents = {}): L.Map {
    if (this.map) return this.map;

    this.events = events;
    const container = typeof options.container === 'string' 
      ? document.getElementById(options.container) 
      : options.container;

    if (!container) throw new Error(`Map container not found`);

    this.map = L.map(container, {
      center: options.center || MAP_CONFIG.DEFAULT_CENTER,
      zoom: options.zoom || MAP_CONFIG.DEFAULT_ZOOM,
      minZoom: options.minZoom || 3,
      maxZoom: options.maxZoom || 18,
      preferCanvas: options.preferCanvas ?? true,
      zoomControl: false // Handled by MapUIManager
    });

    L.tileLayer(MAP_CONFIG.TILE_LAYER_URL, {
      attribution: MAP_CONFIG.TILE_LAYER_ATTRIBUTION
    }).addTo(this.map);

    // Initialize sub-managers
    MarkerManager.getInstance().initialize(this.map);
    LayerManager.getInstance().initialize(this.map);
    MapUIManager.getInstance().initialize(this, MarkerManager.getInstance(), LayerManager.getInstance());

    this.setupMapListeners();
    this.setupResizeObserver(container);

    if (this.events.onMapReady) this.events.onMapReady(this.map);

    return this.map;
  }

  private setupMapListeners(): void {
    if (!this.map) return;

    this.map.on('moveend', () => {
      if (this.events.onBoundsChange) this.events.onBoundsChange(this.map!.getBounds());
    });

    this.map.on('zoomend', () => {
      if (this.events.onZoomChange) this.events.onZoomChange(this.map!.getZoom());
    });

    this.map.on('locationfound', (e) => {
      if (this.events.onLocationFound) this.events.onLocationFound(e.latlng, e.accuracy);
    });
  }

  private setupResizeObserver(container: HTMLElement): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
    this.resizeObserver.observe(container);
  }

  public setView(center: L.LatLngExpression, zoom?: number, animate = true): void {
    if (!this.map) return;
    this.map.setView(center, zoom ?? this.map.getZoom(), { animate });
  }

  public fitBounds(bounds: L.LatLngBoundsExpression, padding: [number, number] = [20, 20]): void {
    if (!this.map) return;
    this.map.fitBounds(bounds, { padding });
  }

  public getMap(): L.Map | null {
    return this.map;
  }

  public destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    MarkerManager.getInstance().destroy();
    LayerManager.getInstance().destroy();
    MapUIManager.getInstance().destroy();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.events = {};
  }
}