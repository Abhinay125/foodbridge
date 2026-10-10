import { supabaseClient } from './SupabaseClient';
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  NgoLocation,
  NgoLocationInsert,
  NgoLocationUpdate,
  FoodListing,
  FoodListingInsert,
  FoodListingUpdate,
  FoodPickupDetail,
  FoodPickupDetailInsert,
  FoodPickupDetailUpdate,
  PickupRequest,
  PickupRequestInsert,
  PickupRequestUpdate,
  Message,
  MessageInsert,
  ActiveLocationShare,
  ActiveLocationShareInsert,
  ActiveLocationShareUpdate,
  FoodListingFilters,
  PickupRequestFilters,
  MessageFilters,
  PaginatedResponse,
  FoodListingWithDonor,
  PickupRequestDetailed,
  MessageWithSender,
} from '@/types/database';

/**
 * Profile queries
 */
export const profileQueries = {
  /**
   * Get profile by user ID
   */
  async getById(userId: string): Promise<Profile | null> {
    return supabaseClient.getById('profiles', userId);
  },

  /**
   * Get profile by email
   */
  async getByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabaseClient.client
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Get profile by email failed: ${error.message}`);
    }
    return data as Profile;
  },

  /**
   * Create a new profile
   */
  async create(data: ProfileInsert): Promise<Profile> {
    return supabaseClient.insert('profiles', data);
  },

  /**
   * Update profile
   */
  async update(userId: string, data: ProfileUpdate): Promise<Profile> {
    const result = await supabaseClient.update('profiles', data, { id: userId });
    return result[0];
  },

  /**
   * Get all NGO profiles
   */
  async getAllNgos(): Promise<Profile[]> {
    const { data, error } = await supabaseClient.client
      .from('profiles')
      .select('*')
      .eq('user_type', 'ngo')
      .eq('is_active', true);
    if (error) throw new Error(`Get NGOs failed: ${error.message}`);
    return data as Profile[];
  },

  /**
   * Search profiles
   */
  async search(query: string, limit: number = 10): Promise<Profile[]> {
    const { data, error } = await supabaseClient.client
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(limit);
    if (error) throw new Error(`Search profiles failed: ${error.message}`);
    return data as Profile[];
  },
};

/**
 * NGO Location queries
 */
export const ngoLocationQueries = {
  /**
   * Get all locations for an NGO
   */
  async getByNgoId(ngoId: string): Promise<NgoLocation[]> {
    const { data, error } = await supabaseClient.client
      .from('ngo_locations')
      .select('*')
      .eq('ngo_id', ngoId)
      .eq('is_active', true);
    if (error) throw new Error(`Get NGO locations failed: ${error.message}`);
    return data as NgoLocation[];
  },

  /**
   * Get location by ID
   */
  async getById(locationId: string): Promise<NgoLocation | null> {
    return supabaseClient.getById('ngo_locations', locationId);
  },

  /**
   * Create a new NGO location
   */
  async create(data: NgoLocationInsert): Promise<NgoLocation> {
    return supabaseClient.insert('ngo_locations', data);
  },

  /**
   * Update NGO location
   */
  async update(locationId: string, data: NgoLocationUpdate): Promise<NgoLocation> {
    const result = await supabaseClient.update('ngo_locations', data, { id: locationId });
    return result[0];
  },

  /**
   * Delete NGO location
   */
  async delete(locationId: string): Promise<void> {
    await supabaseClient.delete('ngo_locations', { id: locationId });
  },

  /**
   * Get nearby NGO locations
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<NgoLocation[]> {
    const { data, error } = await supabaseClient.client.rpc('get_nearby_ngo_locations', {
      center_lat: latitude,
      center_lng: longitude,
      radius_km: radiusKm,
    });
    if (error) throw new Error(`Get nearby NGO locations failed: ${error.message}`);
    return data as NgoLocation[];
  },

  /**
   * Get all active NGO locations with pagination
   */
  async getAllActive(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<NgoLocation>> {
    return supabaseClient.getPaginated('ngo_locations', page, pageSize);
  },
};

/**
 * Food Listing queries
 */
export const foodListingQueries = {
  /**
   * Get food listing by ID
   */
  async getById(listingId: string): Promise<FoodListing | null> {
    return supabaseClient.getById('food_listings', listingId);
  },

  /**
   * Get food listing with donor info
   */
  async getWithDonor(listingId: string): Promise<FoodListingWithDonor | null> {
    const { data, error } = await supabaseClient.client
      .from('food_listings')
      .select(`
        *,
        profiles!food_listings_donor_id_fkey (
          full_name,
          phone,
          rating_average,
          rating_count
        )
      `)
      .eq('id', listingId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Get listing with donor failed: ${error.message}`);
    }
    return data as FoodListingWithDonor;
  },

  /**
   * Create a new food listing
   */
  async create(data: FoodListingInsert): Promise<FoodListing> {
    return supabaseClient.insert('food_listings', data);
  },

  /**
   * Update food listing
   */
  async update(listingId: string, data: FoodListingUpdate): Promise<FoodListing> {
    const result = await supabaseClient.update('food_listings', data, { id: listingId });
    return result[0];
  },

  /**
   * Delete food listing
   */
  async delete(listingId: string): Promise<void> {
    await supabaseClient.delete('food_listings', { id: listingId });
  },

  /**
   * Get listings by donor
   */
  async getByDonor(donorId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<FoodListing>> {
    const { data, error, count } = await supabaseClient.client
      .from('food_listings')
      .select('*', { count: 'exact' })
      .eq('donor_id', donorId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(`Get donor listings failed: ${error.message}`);
    return {
      data: data as FoodListing[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Get available listings with filters
   */
  async getAvailable(
    filters: FoodListingFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<FoodListingWithDonor>> {
    let query = supabaseClient.client
      .from('food_listings')
      .select(`
        *,
        profiles!food_listings_donor_id_fkey (
          full_name,
          phone,
          rating_average,
          rating_count
        )
      `, { count: 'exact' })
      .eq('status', 'available')
      .gte('available_until', new Date().toISOString())
      .order('available_from', { ascending: true });

    if (filters.food_type) {
      query = query.eq('food_type', filters.food_type);
    }
    if (filters.city) {
      query = query.ilike('pickup_city', `%${filters.city}%`);
    }
    if (filters.is_vegetarian !== undefined) {
      query = query.eq('is_vegetarian', filters.is_vegetarian);
    }
    if (filters.is_vegan !== undefined) {
      query = query.eq('is_vegan', filters.is_vegan);
    }
    if (filters.is_halal !== undefined) {
      query = query.eq('is_halal', filters.is_halal);
    }
    if (filters.requires_refrigeration !== undefined) {
      query = query.eq('requires_refrigeration', filters.requires_refrigeration);
    }
    if (filters.available_after) {
      query = query.gte('available_from', filters.available_after);
    }
    if (filters.available_before) {
      query = query.lte('available_until', filters.available_before);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Get available listings failed: ${error.message}`);

    return {
      data: data as FoodListingWithDonor[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Search listings by text
   */
  async search(searchText: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<FoodListingWithDonor>> {
    const { data, error, count } = await supabaseClient.client
      .from('food_listings')
      .select(`
        *,
        profiles!food_listings_donor_id_fkey (
          full_name,
          phone,
          rating_average,
          rating_count
        )
      `, { count: 'exact' })
      .eq('status', 'available')
      .gte('available_until', new Date().toISOString())
      .or(`title.ilike.%${searchText}%,description.ilike.%${searchText}%`)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(`Search listings failed: ${error.message}`);
    return {
      data: data as FoodListingWithDonor[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Get listings near a location
   */
  async getNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<FoodListingWithDonor>> {
    const { data, error, count } = await supabaseClient.client.rpc('get_nearby_food_listings', {
      center_lat: latitude,
      center_lng: longitude,
      radius_km: radiusKm,
      page,
      page_size: pageSize,
    });
    if (error) throw new Error(`Get nearby listings failed: ${error.message}`);
    return {
      data: data as FoodListingWithDonor[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },
};

/**
 * Food Pickup Detail queries
 */
export const foodPickupDetailQueries = {
  /**
   * Get pickup details by listing ID
   */
  async getByListingId(listingId: string): Promise<FoodPickupDetail | null> {
    const { data, error } = await supabaseClient.client
      .from('food_pickup_details')
      .select('*')
      .eq('listing_id', listingId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Get pickup details failed: ${error.message}`);
    }
    return data as FoodPickupDetail;
  },

  /**
   * Create pickup details
   */
  async create(data: FoodPickupDetailInsert): Promise<FoodPickupDetail> {
    return supabaseClient.insert('food_pickup_details', data);
  },

  /**
   * Update pickup details
   */
  async update(listingId: string, data: FoodPickupDetailUpdate): Promise<FoodPickupDetail> {
    const result = await supabaseClient.update('food_pickup_details', data, { listing_id: listingId });
    return result[0];
  },

  /**
   * Delete pickup details
   */
  async delete(listingId: string): Promise<void> {
    await supabaseClient.delete('food_pickup_details', { listing_id: listingId });
  },
};

/**
 * Pickup Request queries
 */
export const pickupRequestQueries = {
  /**
   * Get pickup request by ID
   */
  async getById(requestId: string): Promise<PickupRequest | null> {
    return supabaseClient.getById('pickup_requests', requestId);
  },

  /**
   * Get pickup request with full details
   */
  async getDetailed(requestId: string): Promise<PickupRequestDetailed | null> {
    const { data, error } = await supabaseClient.client
      .from('pickup_requests')
      .select(`
        *,
        food_listings!pickup_requests_listing_id_fkey (
          title,
          food_type,
          pickup_address_line1,
          pickup_city,
          profiles!food_listings_donor_id_fkey (
            full_name,
            phone
          )
        ),
        profiles!pickup_requests_ngo_id_fkey (
          full_name,
          phone
        ),
        ngo_locations!pickup_requests_ngo_location_id_fkey (
          location_name,
          address_line1,
          city
        )
      `)
      .eq('id', requestId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Get detailed pickup request failed: ${error.message}`);
    }
    return data as PickupRequestDetailed;
  },

  /**
   * Create a new pickup request
   */
  async create(data: PickupRequestInsert): Promise<PickupRequest> {
    return supabaseClient.insert('pickup_requests', data);
  },

  /**
   * Update pickup request
   */
  async update(requestId: string, data: PickupRequestUpdate): Promise<PickupRequest> {
    const result = await supabaseClient.update('pickup_requests', data, { id: requestId });
    return result[0];
  },

  /**
   * Delete pickup request
   */
  async delete(requestId: string): Promise<void> {
    await supabaseClient.delete('pickup_requests', { id: requestId });
  },

  /**
   * Get pickup requests by NGO
   */
  async getByNgo(ngoId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<PickupRequestDetailed>> {
    const { data, error, count } = await supabaseClient.client
      .from('pickup_requests')
      .select(`
        *,
        food_listings!pickup_requests_listing_id_fkey (
          title,
          food_type,
          pickup_address_line1,
          pickup_city,
          profiles!food_listings_donor_id_fkey (
            full_name,
            phone
          )
        ),
        profiles!pickup_requests_ngo_id_fkey (
          full_name,
          phone
        ),
        ngo_locations!pickup_requests_ngo_location_id_fkey (
          location_name,
          address_line1,
          city
        )
      `, { count: 'exact' })
      .eq('ngo_id', ngoId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(`Get NGO pickup requests failed: ${error.message}`);
    return {
      data: data as PickupRequestDetailed[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Get pickup requests by donor (via their listings)
   */
  async getByDonor(donorId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<PickupRequestDetailed>> {
    const { data, error, count } = await supabaseClient.client
      .from('pickup_requests')
      .select(`
        *,
        food_listings!pickup_requests_listing_id_fkey (
          title,
          food_type,
          pickup_address_line1,
          pickup_city,
          profiles!food_listings_donor_id_fkey (
            full_name,
            phone
          )
        ),
        profiles!pickup_requests_ngo_id_fkey (
          full_name,
          phone
        ),
        ngo_locations!pickup_requests_ngo_location_id_fkey (
          location_name,
          address_line1,
          city
        )
      `, { count: 'exact' })
      .eq('food_listings.donor_id', donorId)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(`Get donor pickup requests failed: ${error.message}`);
    return {
      data: data as PickupRequestDetailed[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Get pickup requests with filters
   */
  async getWithFilters(
    filters: PickupRequestFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<PickupRequest>> {
    let query = supabaseClient.client
      .from('pickup_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.ngo_id) {
      query = query.eq('ngo_id', filters.ngo_id);
    }
    if (filters.listing_id) {
      query = query.eq('listing_id', filters.listing_id);
    }
    if (filters.donor_id) {
      query = query.eq('food_listings.donor_id', filters.donor_id);
    }
    if (filters.requested_after) {
      query = query.gte('requested_pickup_time', filters.requested_after);
    }
    if (filters.requested_before) {
      query = query.lte('requested_pickup_time', filters.requested_before);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Get filtered pickup requests failed: ${error.message}`);
    return {
      data: data as PickupRequest[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Update pickup request status
   */
  async updateStatus(
    requestId: string,
    status: PickupRequest['status'],
    additionalData: Partial<PickupRequestUpdate> = {}
  ): Promise<PickupRequest> {
    return this.update(requestId, { status, ...additionalData });
  },
};

/**
 * Message queries
 */
export const messageQueries = {
  /**
   * Get message by ID
   */
  async getById(messageId: string): Promise<Message | null> {
    return supabaseClient.getById('messages', messageId);
  },

  /**
   * Get messages between two users (conversation)
   */
  async getConversation(
    userId1: string,
    userId2: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<MessageWithSender>> {
    const { data, error, count } = await supabaseClient.client
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (
          full_name,
          profile_picture_url,
          user_type
        )
      `, { count: 'exact' })
      .or(`and(sender_id.eq.${userId1},recipient_id.eq.${userId2}),and(sender_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw new Error(`Get conversation failed: ${error.message}`);
    return {
      data: data as MessageWithSender[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Get conversations for a user
   */
  async getConversations(userId: string): Promise<Array<{
    id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_avatar?: string;
    other_user_type: 'donor' | 'ngo';
    last_message: MessageWithSender;
    unread_count: number;
    listing_id?: string;
    pickup_request_id?: string;
    updated_at: string;
  }>> {
    // Get all messages for this user, grouped by conversation partner
    const { data, error } = await supabaseClient.client
      .from('messages')
      .select(`
        *,
        profiles!messages_sender_id_fkey (
          full_name,
          profile_picture_url,
          user_type
        ),
        profiles!messages_recipient_id_fkey (
          full_name,
          profile_picture_url,
          user_type
        )
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Get conversations failed: ${error.message}`);
    
    // Group by conversation partner
    const conversations = new Map<string, any>();
    
    (data as any[])?.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      const otherUser = msg.sender_id === userId ? msg.profiles_recipient_id_fkey : msg.profiles_sender_id_fkey;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          id: `${userId}-${otherUserId}`,
          other_user_id: otherUserId,
          other_user_name: otherUser?.full_name || 'Unknown',
          other_user_avatar: otherUser?.profile_picture_url,
          other_user_type: otherUser?.user_type || 'donor',
          last_message: {
            ...msg,
            sender_name: otherUser?.full_name || 'Unknown',
            sender_avatar_url: otherUser?.profile_picture_url,
            sender_user_type: otherUser?.user_type || 'donor'
          },
          unread_count: 0,
          listing_id: msg.listing_id,
          pickup_request_id: msg.pickup_request_id,
          updated_at: msg.created_at
        });
      }
      
      if (!msg.is_read && msg.recipient_id === userId) {
        conversations.get(otherUserId).unread_count++;
      }
    });
    
    return Array.from(conversations.values()).sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  /**
   * Send a new message
   */
  async create(data: MessageInsert): Promise<Message> {
    return supabaseClient.insert('messages', data);
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<Message> {
    const result = await supabaseClient.update('messages', { is_read: true, read_at: new Date().toISOString() }, { id: messageId });
    return result[0];
  },

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(userId: string, otherUserId: string): Promise<void> {
    await supabaseClient.client
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', userId)
      .eq('is_read', false);
  },

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseClient.client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false)
      .eq('is_deleted', false);
    if (error) throw new Error(`Get unread count failed: ${error.message}`);
    return count ?? 0;
  },

  /**
   * Get messages with filters
   */
  async getWithFilters(
    filters: MessageFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<PaginatedResponse<Message>> {
    let query = supabaseClient.client
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (filters.sender_id) {
      query = query.eq('sender_id', filters.sender_id);
    }
    if (filters.recipient_id) {
      query = query.eq('recipient_id', filters.recipient_id);
    }
    if (filters.listing_id) {
      query = query.eq('listing_id', filters.listing_id);
    }
    if (filters.pickup_request_id) {
      query = query.eq('pickup_request_id', filters.pickup_request_id);
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    if (filters.after) {
      query = query.gte('created_at', filters.after);
    }
    if (filters.before) {
      query = query.lte('created_at', filters.before);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(`Get filtered messages failed: ${error.message}`);
    return {
      data: data as Message[],
      count: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count ?? 0) / pageSize),
    };
  },

  /**
   * Delete message (soft delete)
   */
  async delete(messageId: string): Promise<void> {
    await supabaseClient.update('messages', { is_deleted: true, deleted_at: new Date().toISOString() }, { id: messageId });
  },
};

/**
 * Active Location Share queries
 */
export const locationShareQueries = {
  /**
   * Get active location shares for a pickup request
   */
  async getByPickupRequest(pickupRequestId: string): Promise<ActiveLocationShare[]> {
    const { data, error } = await supabaseClient.client
      .from('active_location_shares')
      .select('*')
      .eq('pickup_request_id', pickupRequestId)
      .eq('is_active', true)
      .order('last_update_at', { ascending: false });
    if (error) throw new Error(`Get location shares failed: ${error.message}`);
    return data as ActiveLocationShare[];
  },

  /**
   * Create location share
   */
  async create(data: ActiveLocationShareInsert): Promise<ActiveLocationShare> {
    return supabaseClient.insert('active_location_shares', data);
  },

  /**
   * Update location share
   */
  async update(shareId: string, data: ActiveLocationShareUpdate): Promise<ActiveLocationShare> {
    const result = await supabaseClient.update('active_location_shares', data, { id: shareId });
    return result[0];
  },

  /**
   * End location share
   */
  async end(shareId: string): Promise<ActiveLocationShare> {
    return this.update(shareId, {
      is_active: false,
      share_ended_at: new Date().toISOString(),
    });
  },

  /**
   * Get latest location for a pickup request
   */
  async getLatest(pickupRequestId: string): Promise<ActiveLocationShare | null> {
    const { data, error } = await supabaseClient.client
      .from('active_location_shares')
      .select('*')
      .eq('pickup_request_id', pickupRequestId)
      .eq('is_active', true)
      .order('last_update_at', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Get latest location failed: ${error.message}`);
    }
    return data as ActiveLocationShare;
  },
};

/**
 * Combined query helpers for common operations
 */
export const combinedQueries = {
  /**
   * Get dashboard stats for a donor
   */
  async getDonorDashboardStats(donorId: string): Promise<{
    totalListings: number;
    activeListings: number;
    completedPickups: number;
    totalDonations: number;
    averageRating: number;
  }> {
    const [listings, pickups] = await Promise.all([
      supabaseClient.client
        .from('food_listings')
        .select('status', { count: 'exact' })
        .eq('donor_id', donorId),
      supabaseClient.client
        .from('pickup_requests')
        .select('status', { count: 'exact' })
        .eq('food_listings.donor_id', donorId),
    ]);

    const totalListings = listings.count ?? 0;
    const activeListings = (listings.data ?? []).filter(l => l.status === 'available' || l.status === 'pending').length;
    const completedPickups = (pickups.data ?? []).filter(p => p.status === 'completed').length;

    const profile = await profileQueries.getById(donorId);

    return {
      totalListings,
      activeListings,
      completedPickups,
      totalDonations: profile?.total_donations_given ?? 0,
      averageRating: profile?.rating_average ?? 0,
    };
  },

  /**
   * Get dashboard stats for an NGO
   */
  async getNgoDashboardStats(ngoId: string): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedPickups: number;
    totalReceived: number;
    averageRating: number;
  }> {
    const [requests, profile] = await Promise.all([
      supabaseClient.client
        .from('pickup_requests')
        .select('status', { count: 'exact' })
        .eq('ngo_id', ngoId),
      profileQueries.getById(ngoId),
    ]);

    const totalRequests = requests.count ?? 0;
    const pendingRequests = (requests.data ?? []).filter(r =>
      ['pending', 'accepted', 'confirmed', 'in_transit'].includes(r.status)
    ).length;
    const completedPickups = (requests.data ?? []).filter(r => r.status === 'completed').length;

    return {
      totalRequests,
      pendingRequests,
      completedPickups,
      totalReceived: profile?.total_donations_received ?? 0,
      averageRating: profile?.rating_average ?? 0,
    };
  },
};