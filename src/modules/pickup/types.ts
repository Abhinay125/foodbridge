export type PickupStatusAction = 'accept' | 'reject' | 'confirm' | 'start_transit' | 'complete' | 'cancel' | 'no_show';

export interface PickupRequestFormData {
  listing_id: string;
  requested_pickup_time: string;
  requesting_person_name: string;
  requesting_person_phone: string;
  pickup_vehicle_type: string;
  request_message?: string;
}

export interface PickupCardProps {
  request: any;
  variant: 'donor' | 'ngo';
}