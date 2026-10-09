/**
 * Map configuration constants for FoodBridge
 */

export const MAP_CONFIG = {
  /**
   * Default map center - Hyderabad, India
   */
  DEFAULT_CENTER: {
    latitude: 17.385044,
    longitude: 78.486671,
  } as const,

  /**
   * Default zoom level for map view
   */
  DEFAULT_ZOOM: 13,

  /**
   * Minimum zoom level allowed
   */
  MIN_ZOOM: 3,

  /**
   * Maximum zoom level allowed
   */
  MAX_ZOOM: 19,

  /**
   * Map tile layer URL template
   */
  TILE_LAYER_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  /**
   * OpenStreetMap attribution
   */
  TILE_LAYER_ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

  /**
   * Marker icon sizes
   */
  MARKER_ICON_SIZE: [25, 41] as const,
  MARKER_ICON_ANCHOR: [12, 41] as const,
  MARKER_POPUP_ANCHOR: [1, -34] as const,

  /**
   * Default marker colors by type
   */
  MARKER_COLORS: {
    donor: '#22c55e',
    ngo: '#3b82f6',
    pickup: '#f59e0b',
    delivery: '#ef4444',
  } as const,

  /**
   * Animation duration in milliseconds
   */
  ANIMATION_DURATION: 300,

  /**
   * Fit bounds padding
   */
  FIT_BOUNDS_PADDING: [20, 20] as const,

  /**
   * Location accuracy circle options
   */
  ACCURACY_CIRCLE: {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.15,
    weight: 1,
    opacity: 0.5,
  } as const,
} as const;

/**
 * Map event types
 */
export const MAP_EVENTS = {
  CLICK: 'click',
  MOUSEMOVE: 'mousemove',
  ZOOM: 'zoom',
  MOVE: 'move',
  LOAD: 'load',
  MARKER_CLICK: 'marker_click',
  POPUP_OPEN: 'popupopen',
  POPUP_CLOSE: 'popupclose',
} as const;

/**
 * Map control positions
 */
export const MAP_CONTROL_POSITIONS = {
  TOP_LEFT: 'topleft',
  TOP_RIGHT: 'topright',
  BOTTOM_LEFT: 'bottomleft',
  BOTTOM_RIGHT: 'bottomright',
} as const;

export type MapCenter = typeof MAP_CONFIG.DEFAULT_CENTER;
export type MapZoom = typeof MAP_CONFIG.DEFAULT_ZOOM;
export type MarkerColorKey = keyof typeof MAP_CONFIG.MARKER_COLORS;