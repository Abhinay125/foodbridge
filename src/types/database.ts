/**
 * Complete database types from supabase_schema_migration.sql
 * Generated with exact column names and types from the SQL migration
 */

// ============================================================================
// ENUMS - Status constants as const objects
// ============================================================================

export const UserType = {
  DONOR: 'donor',
  NGO: 'ngo',
} as const

export type UserType = (typeof UserType)[keyof typeof UserType]

export const FoodType = {
  PREPARED_FOOD: 'prepared_food',
  PACKAGED_FOOD: 'packaged_food',
  FRESH_PRODUCE: 'fresh_produce',
  BAKED_GOODS: 'baked_goods',
  DAIRY: 'dairy',
  FROZEN: 'frozen',
  BEVERAGES: 'beverages',
  OTHER: 'other',
} as const

export type FoodType = (typeof FoodType)[keyof typeof FoodType]

export const FoodListingStatus = {
  AVAILABLE: 'available',
  PENDING: 'pending',
  CLAIMED: 'claimed',
  PICKED_UP: 'picked_up',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export type FoodListingStatus = (typeof FoodListingStatus)[keyof typeof FoodListingStatus]

export const PickupRequestStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CONFIRMED: 'confirmed',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const

export type PickupRequestStatus = (typeof PickupRequestStatus)[keyof typeof PickupRequestStatus]

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  SYSTEM: 'system',
} as const

export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export const SystemMessageType = {
  PICKUP_CONFIRMED: 'pickup_confirmed',
  STATUS_CHANGED: 'status_changed',
  NEW_REQUEST: 'new_request',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_REJECTED: 'request_rejected',
  PICKUP_COMPLETED: 'pickup_completed',
  PICKUP_CANCELLED: 'pickup_cancelled',
} as const

export type SystemMessageType = (typeof SystemMessageType)[keyof typeof SystemMessageType]

export const ServiceType = {
  FOOD_PANTRY: 'food_pantry',
  MEAL_SERVICE: 'meal_service',
  FOOD_BANK: 'food_bank',
  COMMUNITY_KITCHEN: 'community_kitchen',
  MOBILE_DISTRIBUTION: 'mobile_distribution',
  OTHER: 'other',
} as const

export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

export const AllergenType = {
  DAIRY: 'dairy',
  EGGS: 'eggs',
  FISH: 'fish',
  SHELLFISH: 'shellfish',
  TREE_NUTS: 'tree_nuts',
  PEANUTS: 'peanuts',
  WHEAT: 'wheat',
  SOY: 'soy',
  SESAME: 'sesame',
  GLUTEN: 'gluten',
  SULFITES: 'sulfites',
  MUSTARD: 'mustard',
  CELERY: 'celery',
  LUPIN: 'lupin',
  MOLLUSKS: 'mollusks',
} as const

export type AllergenType = (typeof AllergenType)[keyof typeof AllergenType]

export const PackagingType = {
  BOXES: 'boxes',
  BAGS: 'bags',
  CONTAINERS: 'containers',
  TRAYS: 'trays',
  CRATES: 'crates',
  PALLETS: 'pallets',
  OTHER: 'other',
} as const

export type PackagingType = (typeof PackagingType)[keyof typeof PackagingType]

export const VehicleType = {
  CAR: 'car',
  VAN: 'van',
  TRUCK: 'truck',
  REFRIGERATED_TRUCK: 'refrigerated_truck',
  CARGO_BIKE: 'cargo_bike',
  OTHER: 'other',
} as const

export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType]

// ============================================================================
// BASE TYPES
// ============================================================================

export interface Timestamps {
  created_at: string
  updated_at: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

// ============================================================================
// PROFILE TABLE
// ============================================================================

export interface Profile extends Timestamps {
  id: string // UUID
  user_type: UserType
  full_name: string
  email: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country: string
  latitude?: number
  longitude?: number
  profile_picture_url?: string
  bio?: string
  is_verified: boolean
  is_active: boolean
  total_donations_given: number
  total_donations_received: number
  rating_average: number
  rating_count: number
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at' | 'total_donations_given' | 'total_donations_received' | 'rating_average' | 'rating_count' | 'is_verified' | 'is_active' | 'country'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'email' | 'user_type'>>

// ============================================================================
// NGO_LOCATIONS TABLE
// ============================================================================

export interface NgoLocation extends Timestamps {
  id: string // UUID
  ngo_id: string // UUID reference to profiles
  location_name: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude: number
  longitude: number
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  operating_hours?: Record<string, string> // JSONB: {"monday": "9:00-17:00", ...}
  services_offered: string[] // TEXT[] - array of ServiceType values
  capacity_description?: string
  persons_helped: number
  is_active: boolean
  accepts_pickups: boolean
  service_radius_km: number
}

export type NgoLocationInsert = Omit<NgoLocation, 'id' | 'created_at' | 'updated_at' | 'country' | 'is_active' | 'accepts_pickups' | 'service_radius_km'>
export type NgoLocationUpdate = Partial<Omit<NgoLocation, 'id' | 'created_at' | 'ngo_id'>>

// ============================================================================
// FOOD_LISTINGS TABLE
// ============================================================================

export interface FoodListing extends Timestamps {
  id: string // UUID
  donor_id: string // UUID reference to profiles
  title: string
  description: string
  food_type: FoodType
  quantity_description: string
  estimated_servings?: number
  preparation_date?: string // DATE
  expiry_date?: string // DATE
  storage_instructions?: string
  allergen_info: AllergenType[]
  is_vegetarian: boolean
  is_vegan: boolean
  is_halal: boolean
  is_kosher: boolean
  pickup_address_line1: string
  pickup_address_line2?: string
  pickup_city: string
  pickup_state: string
  pickup_postal_code: string
  pickup_latitude: number
  pickup_longitude: number
  image_urls: string[]
  available_from: string
  available_until: string
  status: FoodListingStatus
  special_instructions?: string
  requires_refrigeration: boolean
}

export type FoodListingInsert = Omit<FoodListing, 'id' | 'created_at' | 'updated_at' | 'status' | 'is_vegetarian' | 'is_vegan' | 'is_halal' | 'is_kosher' | 'requires_refrigeration' | 'allergen_info' | 'image_urls' | 'available_from'>
export type FoodListingUpdate = Partial<Omit<FoodListing, 'id' | 'created_at' | 'donor_id'>>

// ============================================================================
// FOOD_PICKUP_DETAILS TABLE
// ============================================================================

export interface FoodPickupDetail extends Timestamps {
  id: string // UUID
  listing_id: string // UUID reference to food_listings (unique)
  preferred_pickup_times: string[] // TEXT[] - array of time slots "2024-01-15 10:00-12:00"
  pickup_contact_name?: string
  pickup_contact_phone: string
  pickup_contact_email?: string
  parking_instructions?: string
  building_access_code?: string
  floor_level?: string
  elevator_available: boolean
  packaging_type?: PackagingType
  number_of_packages?: number
  requires_containers: boolean
  donor_provides_packaging: boolean
  assistance_available: boolean
  assistance_description?: string
  suggested_vehicle_type?: VehicleType
  estimated_weight_kg?: number
  estimated_volume_m3?: number
  requires_insulated_transport: boolean
  requires_refrigerated_transport: boolean
  pickup_notes?: string
}

export type FoodPickupDetailInsert = Omit<FoodPickupDetail, 'id' | 'created_at' | 'updated_at' | 'elevator_available' | 'requires_containers' | 'donor_provides_packaging' | 'assistance_available' | 'requires_insulated_transport' | 'requires_refrigerated_transport'>
export type FoodPickupDetailUpdate = Partial<Omit<FoodPickupDetail, 'id' | 'created_at' | 'listing_id'>>

// ============================================================================
// PICKUP_REQUESTS TABLE
// ============================================================================

export interface PickupRequest extends Timestamps {
  id: string // UUID
  listing_id: string // UUID reference to food_listings
  ngo_id: string // UUID reference to profiles (NGO)
  ngo_location_id?: string // UUID reference to ngo_locations
  status: PickupRequestStatus
  requested_pickup_time?: string
  confirmed_pickup_time?: string
  actual_pickup_time?: string
  estimated_delivery_time?: string
  actual_delivery_time?: string
  requesting_person_name: string
  requesting_person_phone: string
  requesting_person_email?: string
  pickup_vehicle_type?: VehicleType
  request_message?: string
  donor_response_message?: string
  confirmation_code?: string
  pickup_verified_by?: string
  delivery_verified_by?: string
  driver_name?: string
  driver_phone?: string
  vehicle_plate_number?: string
  donor_rating?: number
  donor_feedback?: string
  ngo_rating?: number
  ngo_feedback?: string
  issues_reported?: string
  resolution_notes?: string
  cancelled_by?: string // UUID reference to profiles
  cancellation_reason?: string
  cancelled_at?: string
}

export type PickupRequestInsert = Omit<PickupRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'confirmation_code' | 'confirmed_pickup_time' | 'actual_pickup_time' | 'estimated_delivery_time' | 'actual_delivery_time' | 'donor_response_message' | 'pickup_verified_by' | 'delivery_verified_by' | 'donor_rating' | 'donor_feedback' | 'ngo_rating' | 'ngo_feedback' | 'issues_reported' | 'resolution_notes' | 'cancelled_by' | 'cancellation_reason' | 'cancelled_at'>
export type PickupRequestUpdate = Partial<Omit<PickupRequest, 'id' | 'created_at' | 'listing_id' | 'ngo_id'>>

// ============================================================================
// MESSAGES TABLE
// ============================================================================

export interface Message extends Timestamps {
  id: string // UUID
  sender_id: string // UUID reference to profiles
  recipient_id: string // UUID reference to profiles
  listing_id?: string // UUID reference to food_listings
  pickup_request_id?: string // UUID reference to pickup_requests
  message_text: string
  message_type: MessageType
  attachment_urls: string[]
  is_read: boolean
  read_at?: string
  is_system_message: boolean
  system_message_type?: SystemMessageType
  is_deleted: boolean
  deleted_at?: string
}

export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'updated_at' | 'is_read' | 'read_at' | 'is_system_message' | 'is_deleted' | 'deleted_at' | 'attachment_urls'>
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at' | 'sender_id' | 'recipient_id'>>

// ============================================================================
// ACTIVE_LOCATION_SHARES TABLE
// ============================================================================

export interface ActiveLocationShare extends Timestamps {
  id: string // UUID
  pickup_request_id: string // UUID reference to pickup_requests
  shared_by: string // UUID reference to profiles
  current_latitude: number
  current_longitude: number
  heading?: number // Compass direction (0-360)
  speed_kmh?: number // Speed in km/h
  accuracy_meters?: number // GPS accuracy in meters
  is_active: boolean
  share_started_at: string
  share_ended_at?: string
  estimated_time_arrival?: string
  distance_to_destination_km?: number
  device_battery_level?: number
  last_update_at: string
}

export type ActiveLocationShareInsert = Omit<ActiveLocationShare, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'share_started_at' | 'last_update_at'>
export type ActiveLocationShareUpdate = Partial<Omit<ActiveLocationShare, 'id' | 'created_at' | 'pickup_request_id' | 'shared_by'>>

// ============================================================================
// OTP_VERIFICATIONS TABLE
// ============================================================================

export interface OtpVerification extends Timestamps {
  id: string // UUID
  mobile_number: string
  otp: string
  expires_at: string
}

export type OtpVerificationInsert = Omit<OtpVerification, 'id' | 'created_at' | 'updated_at'>
export type OtpVerificationUpdate = Partial<Omit<OtpVerification, 'id' | 'created_at' | 'updated_at'>>

// ============================================================================
// COMPOSITE/VIEW TYPES
// ============================================================================

export interface FoodListingWithDonor extends FoodListing {
  donor_name: string
  donor_phone?: string
  donor_rating_average: number
  donor_rating_count: number
}

export interface PickupRequestDetailed extends PickupRequest {
  listing_title: string
  food_type: FoodType
  pickup_address_line1: string
  pickup_city: string
  donor_name: string
  donor_phone?: string
  ngo_name: string
  ngo_phone?: string
  ngo_location_name?: string
  ngo_address?: string
}

export interface MessageWithSender extends Message {
  sender_name: string
  sender_avatar_url?: string
  sender_user_type: UserType
}

export interface Conversation {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  other_user_type: UserType
  last_message: Message
  unread_count: number
  listing_id?: string
  pickup_request_id?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  code: string
  message: string
  details?: string
  hint?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface SupabaseError extends Error {
  code: string
  details: string
  hint: string
}

// ============================================================================
// REALTIME PAYLOAD TYPES
// ============================================================================

export interface RealtimePayload<T> {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
  errors: string | null
}

export type ProfileRealtimePayload = RealtimePayload<Profile>
export type NgoLocationRealtimePayload = RealtimePayload<NgoLocation>
export type FoodListingRealtimePayload = RealtimePayload<FoodListing>
export type FoodPickupDetailRealtimePayload = RealtimePayload<FoodPickupDetail>
export type PickupRequestRealtimePayload = RealtimePayload<PickupRequest>
export type MessageRealtimePayload = RealtimePayload<Message>
export type ActiveLocationShareRealtimePayload = RealtimePayload<ActiveLocationShare>

// ============================================================================
// FILTER/QUERY TYPES
// ============================================================================

export interface FoodListingFilters {
  food_type?: FoodType
  status?: FoodListingStatus
  donor_id?: string
  city?: string
  state?: string
  is_vegetarian?: boolean
  is_vegan?: boolean
  is_halal?: boolean
  is_kosher?: boolean
  requires_refrigeration?: boolean
  available_after?: string
  available_before?: string
  lat?: number
  lng?: number
  radius_km?: number
}

export interface PickupRequestFilters {
  status?: PickupRequestStatus
  ngo_id?: string
  listing_id?: string
  donor_id?: string
  requested_after?: string
  requested_before?: string
}

export interface MessageFilters {
  sender_id?: string
  recipient_id?: string
  listing_id?: string
  pickup_request_id?: string
  is_read?: boolean
  is_deleted?: boolean
  after?: string
  before?: string
}

// ============================================================================
// TYPE GUARDS / UTILITIES
// ============================================================================

export function isDonor(userType: UserType): userType is 'donor' {
  return userType === UserType.DONOR
}

export function isNgo(userType: UserType): userType is 'ngo' {
  return userType === UserType.NGO
}

export function isActiveListing(status: FoodListingStatus): boolean {
  return status === FoodListingStatus.AVAILABLE || status === FoodListingStatus.PENDING
}

export function isActivePickupRequest(status: PickupRequestStatus): boolean {
  return [
    PickupRequestStatus.PENDING,
    PickupRequestStatus.ACCEPTED,
    PickupRequestStatus.CONFIRMED,
    PickupRequestStatus.IN_TRANSIT,
  ].includes(status as any)
}

export function isTerminalPickupStatus(status: PickupRequestStatus): boolean {
  return [
    PickupRequestStatus.COMPLETED,
    PickupRequestStatus.CANCELLED,
    PickupRequestStatus.REJECTED,
    PickupRequestStatus.NO_SHOW,
  ].includes(status as any)
}

export function isFoodTypeValid(type: string): type is FoodType {
  return Object.values(FoodType).includes(type as FoodType)
}

export function isPickupRequestStatusValid(status: string): status is PickupRequestStatus {
  return Object.values(PickupRequestStatus).includes(status as PickupRequestStatus)
}

export function isFoodListingStatusValid(status: string): status is FoodListingStatus {
  return Object.values(FoodListingStatus).includes(status as FoodListingStatus)
}

// ============================================================================
// DATABASE SCHEMA TYPE (for Drizzle ORM or similar)
// ============================================================================

export interface DatabaseSchema {
  profiles: Profile
  ngo_locations: NgoLocation
  food_listings: FoodListing
  food_pickup_details: FoodPickupDetail
  pickup_requests: PickupRequest
  messages: Message
  active_location_shares: ActiveLocationShare
  otp_verifications: OtpVerification
}

export type TableNames = keyof DatabaseSchema

// Type-safe table name to type mapping
export type TableType<T extends TableNames> = DatabaseSchema[T]

// Insert types mapping
export interface DatabaseInsertSchema {
  profiles: ProfileInsert
  ngo_locations: NgoLocationInsert
  food_listings: FoodListingInsert
  food_pickup_details: FoodPickupDetailInsert
  pickup_requests: PickupRequestInsert
  messages: MessageInsert
  active_location_shares: ActiveLocationShareInsert
  otp_verifications: OtpVerificationInsert
}

export type InsertType<T extends TableNames> = DatabaseInsertSchema[T]

// Update types mapping
export interface DatabaseUpdateSchema {
  profiles: ProfileUpdate
  ngo_locations: NgoLocationUpdate
  food_listings: FoodListingUpdate
  food_pickup_details: FoodPickupDetailUpdate
  pickup_requests: PickupRequestUpdate
  messages: MessageUpdate
  active_location_shares: ActiveLocationShareUpdate
  otp_verifications: OtpVerificationUpdate
}

export type UpdateType<T extends TableNames> = DatabaseUpdateSchema[T]