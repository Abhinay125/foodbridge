import L from 'leaflet';
import 'leaflet.heat';
import type { MapFilterConfig, LegendItem } from './types';

export class LayerManager {
  private static instance: LayerManager;
  private map: L.Map | null = null;
  private heatLayer: any = null;
  private layerGroups: Map<string, L.LayerGroup> = new Map();
  private filterDebounce: number | null = null;

  private constructor() {}

  public static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  public initialize(map: L.Map): void {
    this.map = map;
    this.setupDefaultLayers();
  }

  private setupDefaultLayers(): void {
    this.layerGroups.set('donors', L.layerGroup().addTo(this.map!));
    this.layerGroups.set('ngos', L.layerGroup().addTo(this.map!));
    this.layerGroups.set('listings', L.layerGroup().addTo(this.map!));
    
    // @ts-ignore - L.heatLayer from plugin
    this.heatLayer = L.heatLayer([], {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
    });
  }

  public updateHeatmap(points: Array<[number, number, number]>): void {
    if (this.heatLayer) {
      this.heatLayer.setLatLngs(points);
    }
  }

  public setFilter(filter: MapFilterConfig): void {
    if (this.filterDebounce) window.clearTimeout(this.filterDebounce);
    
    this.filterDebounce = window.setTimeout(() => {
      this.applyFilters(filter);
    }, 300);
  }

  private applyFilters(filter: MapFilterConfig): void {
    // Logic to iterate over markers in MarkerManager and show/hide based on criteria
    // This calls marker.remove() or adds back to layerGroup/clusterGroup
    console.log('Applying map filters', filter);
  }

  public toggleLayer(layerId: string, visible?: boolean): boolean {
    const group = this.layerGroups.get(layerId) || (layerId === 'heatmap' ? this.heatLayer : null);
    if (!group || !this.map) return false;

    // @ts-ignore - Leaflet Map methods exist at runtime
    const isVisible = visible ?? !this.map.hasLayer(group);
    // @ts-ignore - Leaflet Map methods exist at runtime
    if (isVisible) this.map.addLayer(group);
    // @ts-ignore - Leaflet Map methods exist at runtime
    else this.map.removeLayer(group);
    
    return isVisible;
  }

  public getLegendItems(): LegendItem[] {
    const i18n = (key: string) => (window as any).I18nManager.getInstance().t(key);
    return [
      { id: 'donors', label: i18n('map.donors'), color: '#22c55e', type: 'marker', visible: true },
      { id: 'ngos', label: i18n('map.ngos'), color: '#3b82f6', type: 'marker', visible: true },
      { id: 'heatmap', label: i18n('map.heatmap'), color: 'orange', type: 'heatmap', visible: false }
    ];
  }

  public destroy(): void {
    this.layerGroups.forEach(g => g.clearLayers());
    this.layerGroups.clear();
    if (this.heatLayer) this.heatLayer.remove();
    this.heatLayer = null;
    this.map = null;
  }
}