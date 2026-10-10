import L from 'leaflet';
import 'leaflet.locatecontrol';
import 'leaflet-search';
import { I18nManager } from '@/modules/i18n';
import type { MapManager } from './MapManager';
import type { MarkerManager } from './MarkerManager';
import type { LayerManager } from './LayerManager';

export class MapUIManager {
  private static instance: MapUIManager;
  private map: L.Map | null = null;
  private controls: Map<string, L.Control> = new Map();

  private constructor() {}

  public static getInstance(): MapUIManager {
    if (!MapUIManager.instance) {
      MapUIManager.instance = new MapUIManager();
    }
    return MapUIManager.instance;
  }

  public initialize(mapManager: MapManager, _markerManager: MarkerManager, _layerManager: LayerManager): void {
    this.map = mapManager.getMap();
    if (!this.map) return;

    const i18n = I18nManager.getInstance();

    // 1. Zoom - use factory function for proper typing
    const zoom = L.control.zoom({ position: 'topleft' });
    zoom.addTo(this.map);
    this.controls.set('zoom', zoom);

    // 2. Locate - wrap in try-catch as plugin may not be fully loaded
    try {
      // @ts-ignore - plugin adds this at runtime
      const locate = L.control.locate({
        position: 'topleft',
        strings: { title: i18n.t('map.myLocation') },
        locateOptions: { enableHighAccuracy: true }
      });
      locate.addTo(this.map);
      this.controls.set('locate', locate);
    } catch (e) {
      console.warn('Locate control not available:', e);
    }

    // 3. Scale - use factory function for proper typing
    const scale = L.control.scale({ position: 'bottomleft', metric: true, imperial: false });
    scale.addTo(this.map);
    this.controls.set('scale', scale);

    // 4. Search (Needs a layer to search in, typically a flat layer group of all title markers)
    // Placeholder implementation as it depends on data loading
  }

  public showFilterPanel(): void {
    // Custom UI logic for the sidebar filter panel
  }

  public destroy(): void {
    this.controls.forEach(c => c.remove());
    this.controls.clear();
    this.map = null;
  }
}