// Global type declarations

// Window extensions
interface Window {
  // Leaflet map instance reference
  __leafletMap?: L.Map
  // Supabase client instance
  __supabase?: ReturnType<typeof import('@supabase/supabase-js').createClient>
  // App configuration
  __APP_CONFIG__?: {
    supabaseUrl: string
    supabaseAnonKey: string
    appUrl: string
  }
}

// Leaflet namespace augmentation
declare namespace L {
  interface Map {
    // Custom properties for FoodBridge
    _foodbridgeMarkers?: LayerGroup
    _foodbridgeUserLocation?: Marker
  }

  interface Marker {
    _foodbridgeData?: {
      type: 'donor' | 'ngo' | 'listing' | 'pickup'
      id: string
      listingId?: string
      pickupRequestId?: string
    }
  }

  interface LayerGroup {
    _foodbridgeType?: 'donors' | 'ngos' | 'listings' | 'pickups'
  }
}

// Supabase Realtime types
declare namespace Supabase {
  interface RealtimeChannel {
    on<T extends { new: (...args: unknown[]) => unknown }>(
      event: string,
      filter: { event: string; schema: string; table: string },
      callback: (payload: RealtimePostgresChangesPayload<T>) => void
    ): RealtimeChannel
  }

  interface RealtimePostgresChangesPayload<T> {
    schema: string
    table: string
    commit_timestamp: string
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: T
    old: T
    errors: string | null
  }
}

// GeoJSON types
interface GeoJSON {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

interface GeoJSONFeature {
  type: 'Feature'
  geometry: GeoJSONGeometry
  properties: Record<string, unknown>
  id?: string | number
}

interface GeoJSONGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | 'GeometryCollection'
  coordinates: GeoJSONCoordinates
}

type GeoJSONCoordinates =
  | number[] // Point
  | number[][] // LineString, MultiPoint
  | number[][][] // Polygon, MultiLineString
  | number[][][][] // MultiPolygon

// Navigation API types
interface Navigator {
  geolocation: Geolocation
}

interface Geolocation {
  getCurrentPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): void
  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): number
  clearWatch(watchId: number): void
}

interface PositionCallback {
  (position: GeolocationPosition): void
}

interface PositionErrorCallback {
  (error: GeolocationPositionError): void
}

interface PositionOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

interface GeolocationPosition {
  coords: GeolocationCoordinates
  timestamp: DOMTimeStamp
}

interface GeolocationCoordinates {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

interface GeolocationPositionError {
  code: number
  message: string
  PERMISSION_DENIED: 1
  POSITION_UNAVAILABLE: 2
  TIMEOUT: 3
}