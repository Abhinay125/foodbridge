import { FoodListing, FoodPickupDetail, FoodType } from '@/types/database';
import { APP_CONFIG } from '@/config/app';

export interface UploadedImage {
  url: string;
  path: string;
}

export interface FoodListingFormData extends Partial<Omit<FoodListing, 'id' | 'created_at' | 'updated_at'>> {
  pickup_details: Partial<Omit<FoodPickupDetail, 'id' | 'listing_id'>>;
  images: UploadedImage[];
}

export interface FoodFilterOptions {
  foodType?: FoodType[];
  dietary?: ('vegetarian' | 'vegan' | 'gluten-free' | 'halal' | 'kosher' | 'jain')[];
  refrigerated?: boolean;
  city?: string;
  dateRange?: { start: string; end: string };
  radius?: number;
  lat?: number;
  lng?: number;
}

export interface FoodCardProps {
  listing: FoodListing & { pickup_details?: FoodPickupDetail };
  variant: 'donor' | 'ngo' | 'public';
  distance?: number;
  onClaim?: (listingId: string) => void;
  onEdit?: (listingId: string) => void;
  onDelete?: (listingId: string) => void;
  onViewDetails?: (listingId: string) => void;
}

export const UPLOAD_LIMITS = {
  MAX_FILES: APP_CONFIG.MAX_IMAGES_PER_LISTING || 5,
  MAX_SIZE: APP_CONFIG.MAX_FILE_SIZE_BYTES || 5242880,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const
};