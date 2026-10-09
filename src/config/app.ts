/**
 * Application configuration constants for FoodBridge
 */

export const APP_CONFIG = {
  /**
   * Application name
   */
  NAME: 'FoodBridge',

  /**
   * Application version
   */
  VERSION: '1.0.0',

  /**
   * Default language code (ISO 639-1)
   */
  DEFAULT_LANGUAGE: 'en' as const,

  /**
   * Supported languages
   */
  SUPPORTED_LANGUAGES: ['en', 'hi', 'te'] as const,

  /**
   * Application description
   */
  DESCRIPTION:
    'Connecting food donors with NGOs to reduce food waste and fight hunger',

  /**
   * Repository URL
   */
  REPOSITORY_URL: 'https://github.com/foodbridge/foodbridge',

  /**
   * Issue tracker URL
   */
  ISSUES_URL: 'https://github.com/foodbridge/foodbridge/issues',

  /**
   * Contact email
   */
  CONTACT_EMAIL: 'support@foodbridge.org',

  /**
   * Session timeout in milliseconds (24 hours)
   */
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,

  /**
   * Token refresh threshold in milliseconds (5 minutes before expiry)
   */
  TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000,

  /**
   * Maximum file upload size in bytes (5MB)
   */
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,

  /**
   * Allowed file types for uploads
   */
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,

  /**
   * Maximum number of images per listing
   */
  MAX_IMAGES_PER_LISTING: 5,

  /**
   * Default pagination page size
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum pagination page size
   */
  MAX_PAGE_SIZE: 100,

  /**
   * Debounce delay for search inputs in milliseconds
   */
  SEARCH_DEBOUNCE_MS: 300,

  /**
   * Toast notification duration in milliseconds
   */
  TOAST_DURATION_MS: 4000,

  /**
   * Loading spinner minimum display time in milliseconds
   */
  MIN_LOADING_TIME_MS: 500,

  /**
   * Real-time connection retry attempts
   */
  REALTIME_MAX_RETRIES: 5,

  /**
   * Real-time connection retry delay in milliseconds
   */
  REALTIME_RETRY_DELAY_MS: 2000,

  /**
   * Cache time-to-live in milliseconds (5 minutes)
   */
  CACHE_TTL_MS: 5 * 60 * 1000,

  /**
   * Offline storage key prefix
   */
  OFFLINE_STORAGE_PREFIX: 'foodbridge_offline_',

  /**
   * Feature flags
   */
  FEATURES: {
    REALTIME_UPDATES: true,
    LOCATION_SHARING: true,
    PUSH_NOTIFICATIONS: false,
    OFFLINE_MODE: true,
    ANALYTICS: false,
    DARK_MODE: true,
  } as const,
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  DONOR_DASHBOARD: '/dashboard/donor',
  NGO_DASHBOARD: '/dashboard/ngo',
  CREATE_LISTING: '/listings/create',
  LISTING_DETAIL: '/listings/:id',
  MY_LISTINGS: '/listings/my',
  PICKUP_REQUESTS: '/pickup-requests',
  PICKUP_REQUEST_DETAIL: '/pickup-requests/:id',
  MESSAGES: '/messages',
  CONVERSATION: '/messages/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SETTINGS_ACCOUNT: '/settings/account',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_APPEARANCE: '/settings/appearance',
  SETTINGS_LOCATIONS: '/settings/locations',
  MAP: '/map',
  HELP: '/help',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  NOT_FOUND: '*',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'foodbridge_auth_token',
  REFRESH_TOKEN: 'foodbridge_refresh_token',
  USER_PREFERENCES: 'foodbridge_user_preferences',
  LANGUAGE: 'foodbridge_language',
  THEME: 'foodbridge_theme',
  OFFLINE_QUEUE: 'foodbridge_offline_queue',
  LAST_SYNC: 'foodbridge_last_sync',
  ONBOARDING_COMPLETE: 'foodbridge_onboarding_complete',
  MAP_PREFERENCES: 'foodbridge_map_preferences',
} as const;

/**
 * Query keys for React Query / TanStack Query
 */
export const QUERY_KEYS = {
  USER: ['user'] as const,
  PROFILE: ['profile'] as const,
  LISTINGS: ['listings'] as const,
  LISTING: (id: string) => ['listing', id] as const,
  MY_LISTINGS: ['listings', 'my'] as const,
  PICKUP_REQUESTS: ['pickupRequests'] as const,
  PICKUP_REQUEST: (id: string) => ['pickupRequest', id] as const,
  MESSAGES: ['messages'] as const,
  CONVERSATIONS: ['conversations'] as const,
  CONVERSATION: (id: string) => ['conversation', id] as const,
  NGO_LOCATIONS: ['ngoLocations'] as const,
  NGO_LOCATION: (id: string) => ['ngoLocation', id] as const,
  NOTIFICATIONS: ['notifications'] as const,
  UNREAD_COUNT: ['notifications', 'unread'] as const,
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Date/time formats
 */
export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  TIME_ONLY: 'h:mm a',
  RELATIVE: 'relative',
} as const;

export type SupportedLanguage = (typeof APP_CONFIG.SUPPORTED_LANGUAGES)[number];
export type RouteKey = keyof typeof ROUTES;
export type StorageKey = keyof typeof STORAGE_KEYS;
export type FeatureFlag = keyof typeof APP_CONFIG.FEATURES;