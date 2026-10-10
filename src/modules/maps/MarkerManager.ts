import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { MAP_CONFIG } from '@/config/maps';
import { I18nManager } from '@/modules/i18n';
import type { MapMarkerData, MarkerIconOptions, PopupContentData } from './types';

export class MarkerManager {
  private static instance: MarkerManager;
  private map: L.Map | null = null;
  private clusterGroup: any = null; // L.MarkerClusterGroup
  private markers: Map<string, L.Marker> = new Map();
  private markerData: Map<string, MapMarkerData> = new Map();

  private constructor() {}

  public static getInstance(): MarkerManager {
    if (!MarkerManager.instance) {
      MarkerManager.instance = new MarkerManager();
    }
    return MarkerManager.instance;
  }

  public initialize(map: L.Map): void {
    this.map = map;
    this.enableClustering();
  }

  public enableClustering(options: any = {}): void {
    if (this.clusterGroup) return;

    // @ts-ignore - L.markerClusterGroup is provided by plugin
    this.clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => this.createClusterIcon(cluster),
      ...options
    });

    this.map?.addLayer(this.clusterGroup);
  }

  private createClusterIcon(cluster: any): L.DivIcon {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="cluster-marker"><span>${count}</span></div>`,
      className: 'custom-cluster-icon',
      iconSize: [40, 40]
    });
  }

  public addMarker(data: MapMarkerData): L.Marker {
    const icon = this.createIcon({
      type: data.type as any,
      pulse: data.type === 'location_share'
    });

    const marker = L.marker([data.lat, data.lng], { icon });
    
    marker.on('click', () => {
      this.bindPopup(marker, this.transformDataToPopup(data));
      marker.openPopup();
    });

    this.markers.set(data.id, marker);
    this.markerData.set(data.id, data);

    if (this.clusterGroup) {
      this.clusterGroup.addLayer(marker);
    } else {
      marker.addTo(this.map!);
    }

    return marker;
  }

  public createIcon(options: MarkerIconOptions): L.DivIcon {
    const color = MAP_CONFIG.MARKER_COLORS[options.type] || '#727a74';
    const pulseHtml = options.pulse ? '<div class="marker-pulse"></div>' : '';
    const rotate = options.heading ? `transform: rotate(${options.heading}deg);` : '';
    
    let emoji = '📍';
    if (options.type === 'donor') emoji = '🍽️';
    if (options.type === 'ngo') emoji = '🏢';
    if (options.type === 'pickup') emoji = '🚚';
    if (options.type === 'delivery') emoji = '✅';

    return L.divIcon({
      className: `custom-marker-icon ${options.className || ''}`,
      html: `
        <div class="marker-container" style="${rotate}">
          ${pulseHtml}
          <div class="marker-pin" style="background-color: ${color}">
            <span>${emoji}</span>
          </div>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -40]
    });
  }

  private transformDataToPopup(data: MapMarkerData): PopupContentData {
    const i18n = I18nManager.getInstance();
    return {
      title: data.title,
      subtitle: data.subtitle,
      meta: [
        { label: i18n.t('map.clickForDetails'), value: '' }
      ],
      actions: [
        { label: i18n.t('food.viewDetails'), action: 'view', variant: 'primary' }
      ]
    };
  }

  public bindPopup(marker: L.Marker, content: PopupContentData): void {
    const html = `
      <div class="marker-popup">
        <h4>${content.title}</h4>
        ${content.subtitle ? `<p>${content.subtitle}</p>` : ''}
        <div class="popup-actions">
          ${content.actions?.map(a => `
            <button class="btn btn--${a.variant} btn--sm" onclick="window.dispatchEvent(new CustomEvent('map:action', {detail: {id: '${marker.options.title}', action: '${a.action}'}}))">
              ${a.label}
            </button>
          `).join('') || ''}
        </div>
      </div>
    `;
    marker.bindPopup(html);
  }

  public removeMarker(id: string): boolean {
    const marker = this.markers.get(id);
    if (marker) {
      if (this.clusterGroup) this.clusterGroup.removeLayer(marker);
      else marker.remove();
      this.markers.delete(id);
      this.markerData.delete(id);
      return true;
    }
    return false;
  }

  public clearMarkers(): void {
    if (this.clusterGroup) this.clusterGroup.clearLayers();
    this.markers.forEach(m => m.remove());
    this.markers.clear();
    this.markerData.clear();
  }

  public destroy(): void {
    this.clearMarkers();
    if (this.clusterGroup && this.map) {
      this.map.removeLayer(this.clusterGroup);
    }
    this.clusterGroup = null;
    this.map = null;
  }
}