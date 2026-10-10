import { PageConfig } from './types';
import { MapManager } from '@/modules/maps';

export const MapsPage: PageConfig = {
  path: '/map',
  title: 'map.title',
  init: async (container) => {
    container.innerHTML = `<div id="main-map" class="map-container" style="height: calc(100vh - 100px)"></div>`;
    MapManager.getInstance().initialize({
      container: 'main-map',
      zoom: 12
    });
  },
  destroy: () => MapManager.getInstance().destroy()
};