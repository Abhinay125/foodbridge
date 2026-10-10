// src/modules/maps/types.ts
import type { 
  FoodListing, 
  NgoLocation, 
  PickupRequest, 
  ActiveLocationShare, 
  FoodType, 
  PickupRequestStatus, 
  FoodListingStatus 
} from '@/types/database';
import type { MarkerColorKey } from '@/config/maps';
import L from 'leaflet';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarkerData {
  id: string;
  type: 'donor' | 'ngo' | 'pickup' | 'delivery' | 'listing' | 'location_share';
  lat: number;
  lng: number;
  listing?: FoodListing & { donor_name?: string; donor_rating?: number };
  ngoLocation?: NgoLocation;
  pickupRequest?: PickupRequest & { listing_title?: string; food_type?: FoodType; donor_name?: string; ngo_name?: string };
  locationShare?: ActiveLocationShare;
  title: string;
  subtitle?: string;
  status?: FoodListingStatus | PickupRequestStatus;
  timestamp?: string;
}

export interface MapManagerOptions {
  container: string | HTMLElement;
  center?: LatLng;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  preferCanvas?: boolean;
}

export interface MapLayerConfig {
  id: string;
  name: string;
  type: 'markers' | 'heatmap' | 'clusters' | 'tile' | 'geojson';
  visible: boolean;
  data?: MapMarkerData[] | any;
  options?: Record<string, any>;
  zIndex?: number;
}

export interface MapEvents {
  onMapReady?: (map: L.Map) => void;
  onMarkerClick?: (marker: L.Marker, data: MapMarkerData) => void;
  onMarkerHover?: (marker: L.Marker, data: MapMarkerData) => void;
  onClusterClick?: (cluster: any, markers: MapMarkerData[]) => void;
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  onZoomChange?: (zoom: number) => void;
  onLayerToggle?: (layerId: string, visible: boolean) => void;
  onLocationFound?: (latlng: L.LatLng, accuracy: number) => void;
  onError?: (error: Error) => void;
}

export interface MarkerIconOptions {
  type: MarkerColorKey;
  size?: [number, number];
  label?: string;
  className?: string;
  pulse?: boolean;
  heading?: number;
}

export interface PopupContentData {
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string; icon?: string }>;
  actions?: Array<{ label: string; action: string; variant: 'primary' | 'secondary' | 'danger' }>;
  avatar?: string;
  rating?: number;
}

export interface MapFilterConfig {
  foodTypes?: FoodType[];
  statuses?: (FoodListingStatus | PickupRequestStatus)[];
  dateRange?: { from: string; to: string };
  radiusKm?: number;
  center?: { lat: number; lng: number };
}

export interface LegendItem {
  id: string;
  label: string;
  color: string;
  type: 'marker' | 'heatmap' | 'circle';
  visible: boolean;
}

export interface RealtimeSubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (event: RealtimeEvent) => void;
}

export interface RealtimeEvent {
  type: string;
  table: string;
  record: any;
  oldRecord: any;
  timestamp: string;
  subscriptionId: string;
}

export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type RealtimeConnectionStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

export interface LocationShareUpdate {
  id: string;
  pickup_request_id: string;
  shared_by: string;
  current_latitude: number;
  current_longitude: number;
  heading?: number;
  speed_kmh?: number;
  accuracy_meters?: number;
  is_active: boolean;
  share_started_at: string;
  share_ended_at?: string;
  estimated_time_arrival?: string;
  distance_to_destination_km?: number;
  device_battery_level?: number;
  last_update_at: string;
}

export interface PresenceState {
  [key: string]: UserPresence[];
}

export interface UserPresence {
  userId: string;
  userName: string;
  userType: 'donor' | 'ngo';
  avatar?: string;
  lat?: number;
  lng?: number;
  lastActive: string;
  status: 'online' | 'away' | 'offline';
}