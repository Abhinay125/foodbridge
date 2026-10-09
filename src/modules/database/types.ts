/**
 * Database types barrel export
 * Re-exports all types from @types/database for convenient importing
 */

// Enums
export {
  UserType,
  type UserType as UserTypeEnum,
  FoodType,
  type FoodType as FoodTypeEnum,
  FoodListingStatus,
  type FoodListingStatus as FoodListingStatusEnum,
  PickupRequestStatus,
  type PickupRequestStatus as PickupRequestStatusEnum,
  MessageType,
  type MessageType as MessageTypeEnum,
  SystemMessageType,
  type SystemMessageType as SystemMessageTypeEnum,
  ServiceType,
  type ServiceType as ServiceTypeEnum,
  AllergenType,
  type AllergenType as AllergenTypeEnum,
  PackagingType,
  type PackagingType as PackagingTypeEnum,
  VehicleType,
  type VehicleType as VehicleTypeEnum,
} from '@/types/database';

// Base types
export {
  type Timestamps,
  type Coordinates,
  type Address,
} from '@/types/database';

// Table types
export {
  type Profile,
  type ProfileInsert,
  type ProfileUpdate,
  type NgoLocation,
  type NgoLocationInsert,
  type NgoLocationUpdate,
  type FoodListing,
  type FoodListingInsert,
  type FoodListingUpdate,
  type FoodPickupDetail,
  type FoodPickupDetailInsert,
  type FoodPickupDetailUpdate,
  type PickupRequest,
  type PickupRequestInsert,
  type PickupRequestUpdate,
  type Message,
  type MessageInsert,
  type MessageUpdate,
  type ActiveLocationShare,
  type ActiveLocationShareInsert,
  type ActiveLocationShareUpdate,
} from '@/types/database';

// Composite/View types
export {
  type FoodListingWithDonor,
  type PickupRequestDetailed,
  type MessageWithSender,
  type Conversation,
} from '@/types/database';

// API Response types
export {
  type PaginatedResponse,
  type ApiError,
  type ApiResponse,
  type SupabaseError,
} from '@/types/database';

// Realtime payload types
export {
  type RealtimePayload,
  type ProfileRealtimePayload,
  type NgoLocationRealtimePayload,
  type FoodListingRealtimePayload,
  type FoodPickupDetailRealtimePayload,
  type PickupRequestRealtimePayload,
  type MessageRealtimePayload,
  type ActiveLocationShareRealtimePayload,
} from '@/types/database';

// Filter/Query types
export {
  type FoodListingFilters,
  type PickupRequestFilters,
  type MessageFilters,
} from '@/types/database';

// Type guards / utilities
export {
  isDonor,
  isNgo,
  isActiveListing,
  isActivePickupRequest,
  isTerminalPickupStatus,
  isFoodTypeValid,
  isPickupRequestStatusValid,
  isFoodListingStatusValid,
} from '@/types/database';

// Database schema types
export {
  type DatabaseSchema,
  type TableNames,
  type TableType,
  type DatabaseInsertSchema,
  type InsertType,
  type DatabaseUpdateSchema,
  type UpdateType,
} from '@/types/database';