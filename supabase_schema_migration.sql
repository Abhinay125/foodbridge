-- ============================================================================
-- FoodBridge Complete PostgreSQL Schema Migration
-- ============================================================================
-- Description: Complete database schema for FoodBridge food donation platform
-- Features: User profiles, NGO locations, food listings, pickups, messaging
-- Created: 2026-10-09
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Description: User account information for both donors and NGOs
-- Links to Supabase auth.users table
-- ============================================================================

CREATE TABLE profiles (
    -- Primary identifier
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- User type: 'donor' or 'ngo'
    user_type TEXT NOT NULL CHECK (user_type IN ('donor', 'ngo')),
    
    -- Profile information
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    
    -- Address information
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'USA',
    
    -- Geographic coordinates for location-based matching
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Profile metadata
    profile_picture_url TEXT,
    bio TEXT,
    
    -- Account status
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Statistics for reputation system
    total_donations_given INTEGER DEFAULT 0 CHECK (total_donations_given >= 0),
    total_donations_received INTEGER DEFAULT 0 CHECK (total_donations_received >= 0),
    rating_average DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for profiles
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Comments for profiles
COMMENT ON TABLE profiles IS 'User profiles for both food donors and NGO recipients';
COMMENT ON COLUMN profiles.user_type IS 'Type of user account: donor or ngo';
COMMENT ON COLUMN profiles.is_verified IS 'Whether the user has been verified by admin';
COMMENT ON COLUMN profiles.rating_average IS 'Average rating from 0 to 5';

-- ============================================================================
-- TABLE: ngo_locations
-- ============================================================================
-- Description: NGO service locations and operating details
-- NGOs can have multiple service locations
-- ============================================================================

CREATE TABLE ngo_locations (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to profiles (must be NGO type)
    ngo_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Location details
    location_name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT DEFAULT 'USA',
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Contact information for this location
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- Operating details
    operating_hours JSONB, -- {"monday": "9:00-17:00", "tuesday": "9:00-17:00", ...}
    services_offered TEXT[], -- Array of services: food_pantry, meal_service, etc.
    capacity_description TEXT,
    persons_helped INTEGER DEFAULT 0 CHECK (persons_helped >= 0),
    
    -- Location status
    is_active BOOLEAN DEFAULT TRUE,
    accepts_pickups BOOLEAN DEFAULT TRUE,
    
    -- Service area radius in kilometers
    service_radius_km DECIMAL(5, 2) DEFAULT 10.00 CHECK (service_radius_km >= 0),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for ngo_locations
CREATE INDEX idx_ngo_locations_ngo_id ON ngo_locations(ngo_id);
CREATE INDEX idx_ngo_locations_location ON ngo_locations(latitude, longitude);
CREATE INDEX idx_ngo_locations_is_active ON ngo_locations(is_active);
CREATE INDEX idx_ngo_locations_accepts_pickups ON ngo_locations(accepts_pickups);
CREATE INDEX idx_ngo_locations_city ON ngo_locations(city);
CREATE INDEX idx_ngo_locations_created_at ON ngo_locations(created_at DESC);

-- Comments for ngo_locations
COMMENT ON TABLE ngo_locations IS 'Service locations for NGO organizations';
COMMENT ON COLUMN ngo_locations.operating_hours IS 'JSON object with operating hours per day';
COMMENT ON COLUMN ngo_locations.services_offered IS 'Array of service types offered at this location';
COMMENT ON COLUMN ngo_locations.service_radius_km IS 'Preferred service area radius in kilometers';

-- ============================================================================
-- TABLE: food_listings
-- ============================================================================
-- Description: Food donation listings created by donors
-- Contains details about available food items
-- ============================================================================

CREATE TABLE food_listings (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to donor profile
    donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Food details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    food_type TEXT NOT NULL CHECK (food_type IN (
        'prepared_food', 'packaged_food', 'fresh_produce', 
        'baked_goods', 'dairy', 'frozen', 'beverages', 'other'
    )),
    
    -- Quantity information
    quantity_description TEXT NOT NULL, -- e.g., "20 servings", "10 kg", "5 boxes"
    estimated_servings INTEGER CHECK (estimated_servings > 0),
    
    -- Food safety and quality
    preparation_date DATE,
    expiry_date DATE,
    storage_instructions TEXT,
    allergen_info TEXT[], -- Array of allergens: dairy, nuts, gluten, etc.
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_halal BOOLEAN DEFAULT FALSE,
    is_kosher BOOLEAN DEFAULT FALSE,
    
    -- Pickup location (defaults to donor's profile location)
    pickup_address_line1 TEXT NOT NULL,
    pickup_address_line2 TEXT,
    pickup_city TEXT NOT NULL,
    pickup_state TEXT NOT NULL,
    pickup_postal_code TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    
    -- Images
    image_urls TEXT[], -- Array of image URLs
    
    -- Availability
    available_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    available_until TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
        'available', 'pending', 'claimed', 'picked_up', 'expired', 'cancelled'
    )),
    
    -- Special instructions
    special_instructions TEXT,
    requires_refrigeration BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_availability_period CHECK (available_until > available_from),
    CONSTRAINT valid_expiry CHECK (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
);

-- Indexes for food_listings
CREATE INDEX idx_food_listings_donor_id ON food_listings(donor_id);
CREATE INDEX idx_food_listings_status ON food_listings(status);
CREATE INDEX idx_food_listings_food_type ON food_listings(food_type);
CREATE INDEX idx_food_listings_location ON food_listings(pickup_latitude, pickup_longitude);
CREATE INDEX idx_food_listings_available_from ON food_listings(available_from);
CREATE INDEX idx_food_listings_available_until ON food_listings(available_until);
CREATE INDEX idx_food_listings_created_at ON food_listings(created_at DESC);
CREATE INDEX idx_food_listings_dietary ON food_listings(is_vegetarian, is_vegan, is_halal, is_kosher);
CREATE INDEX idx_food_listings_active ON food_listings(status) WHERE status IN ('available', 'pending');

-- Comments for food_listings
COMMENT ON TABLE food_listings IS 'Food donation listings created by donors';
COMMENT ON COLUMN food_listings.status IS 'Current status of the food listing';
COMMENT ON COLUMN food_listings.allergen_info IS 'Array of allergen information';
COMMENT ON COLUMN food_listings.image_urls IS 'Array of food item image URLs';

-- ============================================================================
-- TABLE: food_pickup_details
-- ============================================================================
-- Description: Detailed pickup logistics and coordination information
-- One-to-one relationship with food_listings
-- ============================================================================

CREATE TABLE food_pickup_details (
    -- Primary identifier (same as listing_id for 1:1 relationship)
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to food listing
    listing_id UUID NOT NULL UNIQUE REFERENCES food_listings(id) ON DELETE CASCADE,
    
    -- Pickup coordination
    preferred_pickup_times TEXT[], -- Array of time slots: "2024-01-15 10:00-12:00"
    pickup_contact_name TEXT,
    pickup_contact_phone TEXT NOT NULL,
    pickup_contact_email TEXT,
    
    -- Logistics
    parking_instructions TEXT,
    building_access_code TEXT,
    floor_level TEXT,
    elevator_available BOOLEAN DEFAULT TRUE,
    
    -- Packaging details
    packaging_type TEXT, -- boxes, bags, containers, etc.
    number_of_packages INTEGER CHECK (number_of_packages > 0),
    requires_containers BOOLEAN DEFAULT FALSE,
    donor_provides_packaging BOOLEAN DEFAULT TRUE,
    
    -- Loading assistance
    assistance_available BOOLEAN DEFAULT FALSE,
    assistance_description TEXT,
    
    -- Vehicle requirements
    suggested_vehicle_type TEXT, -- car, van, truck, etc.
    estimated_weight_kg DECIMAL(8, 2) CHECK (estimated_weight_kg > 0),
    estimated_volume_m3 DECIMAL(8, 2) CHECK (estimated_volume_m3 > 0),
    
    -- Special requirements
    requires_insulated_transport BOOLEAN DEFAULT FALSE,
    requires_refrigerated_transport BOOLEAN DEFAULT FALSE,
    
    -- Additional notes
    pickup_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for food_pickup_details
CREATE INDEX idx_food_pickup_details_listing_id ON food_pickup_details(listing_id);
CREATE INDEX idx_food_pickup_details_created_at ON food_pickup_details(created_at DESC);

-- Comments for food_pickup_details
COMMENT ON TABLE food_pickup_details IS 'Detailed pickup logistics for food listings';
COMMENT ON COLUMN food_pickup_details.preferred_pickup_times IS 'Array of preferred pickup time slots';
COMMENT ON COLUMN food_pickup_details.packaging_type IS 'Type of packaging used for transport';

-- ============================================================================
-- TABLE: pickup_requests
-- ============================================================================
-- Description: Pickup requests from NGOs for food listings
-- Tracks the entire pickup workflow
-- ============================================================================

CREATE TABLE pickup_requests (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    listing_id UUID NOT NULL REFERENCES food_listings(id) ON DELETE CASCADE,
    ngo_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    ngo_location_id UUID REFERENCES ngo_locations(id) ON DELETE SET NULL,
    
    -- Request status workflow
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- NGO has requested pickup
        'accepted',     -- Donor has accepted the request
        'rejected',     -- Donor has rejected the request
        'confirmed',    -- Pickup details confirmed by both parties
        'in_transit',   -- Food is being transported
        'completed',    -- Food successfully delivered
        'cancelled',    -- Request cancelled by either party
        'no_show'       -- Scheduled pickup did not happen
    )),
    
    -- Scheduling
    requested_pickup_time TIMESTAMP WITH TIME ZONE,
    confirmed_pickup_time TIMESTAMP WITH TIME ZONE,
    actual_pickup_time TIMESTAMP WITH TIME ZONE,
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    actual_delivery_time TIMESTAMP WITH TIME ZONE,
    
    -- NGO request details
    requesting_person_name TEXT NOT NULL,
    requesting_person_phone TEXT NOT NULL,
    requesting_person_email TEXT,
    pickup_vehicle_type TEXT,
    
    -- Communication
    request_message TEXT,
    donor_response_message TEXT,
    
    -- Confirmation details
    confirmation_code TEXT UNIQUE, -- Generated code for pickup verification
    pickup_verified_by TEXT, -- Name of person who verified pickup
    delivery_verified_by TEXT, -- Name of person who verified delivery
    
    -- Tracking
    driver_name TEXT,
    driver_phone TEXT,
    vehicle_plate_number TEXT,
    
    -- Feedback and ratings
    donor_rating INTEGER CHECK (donor_rating >= 1 AND donor_rating <= 5),
    donor_feedback TEXT,
    ngo_rating INTEGER CHECK (ngo_rating >= 1 AND ngo_rating <= 5),
    ngo_feedback TEXT,
    
    -- Issue reporting
    issues_reported TEXT,
    resolution_notes TEXT,
    
    -- Cancellation tracking
    cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_pickup_times CHECK (
        confirmed_pickup_time IS NULL OR 
        confirmed_pickup_time >= requested_pickup_time
    ),
    CONSTRAINT valid_actual_times CHECK (
        actual_pickup_time IS NULL OR 
        actual_delivery_time IS NULL OR 
        actual_delivery_time >= actual_pickup_time
    )
);

-- Indexes for pickup_requests
CREATE INDEX idx_pickup_requests_listing_id ON pickup_requests(listing_id);
CREATE INDEX idx_pickup_requests_ngo_id ON pickup_requests(ngo_id);
CREATE INDEX idx_pickup_requests_ngo_location_id ON pickup_requests(ngo_location_id);
CREATE INDEX idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX idx_pickup_requests_confirmation_code ON pickup_requests(confirmation_code);
CREATE INDEX idx_pickup_requests_requested_pickup_time ON pickup_requests(requested_pickup_time);
CREATE INDEX idx_pickup_requests_confirmed_pickup_time ON pickup_requests(confirmed_pickup_time);
CREATE INDEX idx_pickup_requests_created_at ON pickup_requests(created_at DESC);
CREATE INDEX idx_pickup_requests_active ON pickup_requests(status) 
    WHERE status IN ('pending', 'accepted', 'confirmed', 'in_transit');

-- Comments for pickup_requests
COMMENT ON TABLE pickup_requests IS 'Pickup requests from NGOs for food donations';
COMMENT ON COLUMN pickup_requests.status IS 'Current status of the pickup request workflow';
COMMENT ON COLUMN pickup_requests.confirmation_code IS 'Unique code for verifying pickup';
COMMENT ON COLUMN pickup_requests.cancelled_by IS 'User ID who cancelled the request';

-- ============================================================================
-- TABLE: messages
-- ============================================================================
-- Description: Direct messaging between donors and NGOs
-- Supports conversations about specific listings
-- ============================================================================

CREATE TABLE messages (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Context (optional - can be general messages or listing-specific)
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE CASCADE,
    
    -- Message content
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN (
        'text', 'image', 'location', 'system'
    )),
    
    -- Attachments
    attachment_urls TEXT[], -- Array of attachment URLs
    
    -- Status tracking
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- System messages
    is_system_message BOOLEAN DEFAULT FALSE,
    system_message_type TEXT, -- pickup_confirmed, status_changed, etc.
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT different_sender_recipient CHECK (sender_id != recipient_id),
    CONSTRAINT read_time_after_creation CHECK (read_at IS NULL OR read_at >= created_at)
);

-- Indexes for messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_listing_id ON messages(listing_id);
CREATE INDEX idx_messages_pickup_request_id ON messages(pickup_request_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = FALSE;

-- Comments for messages
COMMENT ON TABLE messages IS 'Direct messages between donors and NGOs';
COMMENT ON COLUMN messages.message_type IS 'Type of message content: text, image, location, system';
COMMENT ON COLUMN messages.is_system_message IS 'Whether this is an automated system message';
COMMENT ON COLUMN messages.attachment_urls IS 'Array of attachment URLs';

-- ============================================================================
-- TABLE: active_location_shares
-- ============================================================================
-- Description: Real-time location sharing during food pickup/delivery
-- Temporary table for live tracking
-- ============================================================================

CREATE TABLE active_location_shares (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    pickup_request_id UUID NOT NULL REFERENCES pickup_requests(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Location data
    current_latitude DECIMAL(10, 8) NOT NULL,
    current_longitude DECIMAL(11, 8) NOT NULL,
    heading DECIMAL(5, 2), -- Compass direction (0-360)
    speed_kmh DECIMAL(5, 2), -- Speed in km/h
    accuracy_meters DECIMAL(6, 2), -- GPS accuracy in meters
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    share_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    share_ended_at TIMESTAMP WITH TIME ZONE,
    
    -- ETAs and distance
    estimated_time_arrival TIMESTAMP WITH TIME ZONE,
    distance_to_destination_km DECIMAL(8, 2),
    
    -- Battery and device info (optional, for reliability)
    device_battery_level INTEGER CHECK (device_battery_level >= 0 AND device_battery_level <= 100),
    last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_share_period CHECK (
        share_ended_at IS NULL OR share_ended_at >= share_started_at
    )
);

-- Indexes for active_location_shares
CREATE INDEX idx_active_location_shares_pickup_request_id ON active_location_shares(pickup_request_id);
CREATE INDEX idx_active_location_shares_shared_by ON active_location_shares(shared_by);
CREATE INDEX idx_active_location_shares_is_active ON active_location_shares(is_active);
CREATE INDEX idx_active_location_shares_last_update ON active_location_shares(last_update_at DESC);
CREATE INDEX idx_active_location_shares_location ON active_location_shares(current_latitude, current_longitude);

-- Comments for active_location_shares
COMMENT ON TABLE active_location_shares IS 'Real-time location sharing during pickups and deliveries';
COMMENT ON COLUMN active_location_shares.heading IS 'Compass direction in degrees (0-360)';
COMMENT ON COLUMN active_location_shares.accuracy_meters IS 'GPS accuracy in meters';
COMMENT ON COLUMN active_location_shares.last_update_at IS 'Last location update timestamp';

-- ============================================================================
-- FUNCTIONS: Automatic timestamp updates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ngo_locations_updated_at BEFORE UPDATE ON ngo_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_listings_updated_at BEFORE UPDATE ON food_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_pickup_details_updated_at BEFORE UPDATE ON food_pickup_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pickup_requests_updated_at BEFORE UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_location_shares_updated_at BEFORE UPDATE ON active_location_shares
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngo_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_pickup_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_location_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================

-- SELECT: Users can view all public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (TRUE);

-- INSERT: Anyone can insert a profile (for anonymous users creating listings)
CREATE POLICY "Anyone can insert profile" 
    ON profiles FOR INSERT 
    WITH CHECK (TRUE);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile
CREATE POLICY "Users can delete own profile" 
    ON profiles FOR DELETE 
    USING (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES: ngo_locations
-- ============================================================================

-- SELECT: Everyone can view active NGO locations
CREATE POLICY "Anyone can view active NGO locations" 
    ON ngo_locations FOR SELECT 
    USING (is_active = TRUE);

-- SELECT: NGOs can view their own inactive locations
CREATE POLICY "NGOs can view own inactive locations" 
    ON ngo_locations FOR SELECT 
    USING (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- INSERT: NGOs can create their own locations (authenticated)
CREATE POLICY "NGOs can create their own locations" 
    ON ngo_locations FOR INSERT 
    WITH CHECK (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- INSERT: Allow anonymous/public insert for NGO onboarding (edge function with service role)
CREATE POLICY "Service role can create NGO locations"
    ON ngo_locations FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- UPDATE: NGOs can update their own locations
CREATE POLICY "NGOs can update own locations" 
    ON ngo_locations FOR UPDATE 
    USING (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    )
    WITH CHECK (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- DELETE: NGOs can delete their own locations
CREATE POLICY "NGOs can delete own locations" 
    ON ngo_locations FOR DELETE 
    USING (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- ============================================================================
-- RLS POLICIES: food_listings
-- ============================================================================

-- SELECT: Everyone can view available food listings
CREATE POLICY "Anyone can view available food listings" 
    ON food_listings FOR SELECT 
    USING (
        status IN ('available', 'pending') AND 
        available_until > NOW()
    );

-- SELECT: Donors can view all their own listings
CREATE POLICY "Donors can view own listings" 
    ON food_listings FOR SELECT 
    USING (
        donor_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- SELECT: NGOs can view listings they have requested
CREATE POLICY "NGOs can view listings they requested" 
    ON food_listings FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE pickup_requests.listing_id = food_listings.id 
            AND pickup_requests.ngo_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- INSERT: Anyone can create food listings (anonymous/public access)
CREATE POLICY "Anyone can create food listings" 
    ON food_listings FOR INSERT 
    WITH CHECK (TRUE);

-- UPDATE: Donors can update their own listings
CREATE POLICY "Donors can update own listings" 
    ON food_listings FOR UPDATE 
    USING (
        donor_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    )
    WITH CHECK (
        donor_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- DELETE: Donors can delete their own listings (only if not yet claimed)
CREATE POLICY "Donors can delete own unclaimed listings" 
    ON food_listings FOR DELETE 
    USING (
        donor_id = auth.uid() AND 
        status IN ('available', 'cancelled') AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- ============================================================================
-- RLS POLICIES: food_pickup_details
-- ============================================================================

-- SELECT: Users can view pickup details for listings they can see
CREATE POLICY "Users can view pickup details for accessible listings" 
    ON food_pickup_details FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = food_pickup_details.listing_id 
            AND (
                -- Donor owns the listing
                food_listings.donor_id = auth.uid() OR 
                -- NGO has requested this listing
                EXISTS (
                    SELECT 1 FROM pickup_requests 
                    WHERE pickup_requests.listing_id = food_listings.id 
                    AND pickup_requests.ngo_id = auth.uid()
                ) OR
                -- Listing is publicly available
                (food_listings.status = 'available' AND food_listings.available_until > NOW())
            )
        )
    );

-- INSERT: Anyone can create pickup details for listings (anonymous/public access)
CREATE POLICY "Anyone can create pickup details" 
    ON food_pickup_details FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = food_pickup_details.listing_id 
            AND food_listings.status = 'available'
        )
    );

-- UPDATE: Donors can update pickup details for their own listings
CREATE POLICY "Donors can update pickup details for own listings" 
    ON food_pickup_details FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = food_pickup_details.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = food_pickup_details.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- DELETE: Donors can delete pickup details for their own listings
CREATE POLICY "Donors can delete pickup details for own listings" 
    ON food_pickup_details FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = food_pickup_details.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- ============================================================================
-- RLS POLICIES: pickup_requests
-- ============================================================================

-- SELECT: Donors can view requests for their listings
CREATE POLICY "Donors can view requests for their listings" 
    ON pickup_requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = pickup_requests.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

-- SELECT: NGOs can view their own requests
CREATE POLICY "NGOs can view own requests" 
    ON pickup_requests FOR SELECT 
    USING (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- INSERT: Anyone can create pickup requests (anonymous/public access)
CREATE POLICY "Anyone can create pickup requests" 
    ON pickup_requests FOR INSERT 
    WITH CHECK (
        -- Ensure listing is available
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = pickup_requests.listing_id 
            AND food_listings.status = 'available'
            AND food_listings.available_until > NOW()
        )
    );

-- UPDATE: Both donors and NGOs can update requests they're involved in
CREATE POLICY "Donors can update requests for their listings" 
    ON pickup_requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = pickup_requests.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM food_listings 
            WHERE food_listings.id = pickup_requests.listing_id 
            AND food_listings.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

CREATE POLICY "NGOs can update own requests" 
    ON pickup_requests FOR UPDATE 
    USING (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    )
    WITH CHECK (
        ngo_id = auth.uid() AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- DELETE: NGOs can delete their own pending requests
CREATE POLICY "NGOs can delete own pending requests" 
    ON pickup_requests FOR DELETE 
    USING (
        ngo_id = auth.uid() AND 
        status = 'pending' AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- ============================================================================
-- RLS POLICIES: messages
-- ============================================================================

-- SELECT: Users can view messages they sent or received
CREATE POLICY "Users can view their own messages" 
    ON messages FOR SELECT 
    USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- INSERT: Anyone can send messages (anonymous/public access)
CREATE POLICY "Anyone can send messages" 
    ON messages FOR INSERT 
    WITH CHECK (
        sender_id != recipient_id AND
        -- Both users must exist and be active
        EXISTS (SELECT 1 FROM profiles WHERE id = sender_id AND is_active = TRUE) AND
        EXISTS (SELECT 1 FROM profiles WHERE id = recipient_id AND is_active = TRUE)
    );

-- UPDATE: Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read" 
    ON messages FOR UPDATE 
    USING (recipient_id = auth.uid())
    WITH CHECK (
        recipient_id = auth.uid() AND
        -- Only allow updating read status
        is_read = TRUE AND read_at = NOW()
    );

-- UPDATE: Senders can soft-delete their own messages
CREATE POLICY "Senders can delete own messages" 
    ON messages FOR UPDATE 
    USING (sender_id = auth.uid())
    WITH CHECK (
        sender_id = auth.uid() AND
        is_deleted = TRUE
    );

-- DELETE: No hard deletes allowed (use soft delete instead)
-- (No DELETE policy means no one can hard delete)

-- ============================================================================
-- RLS POLICIES: active_location_shares
-- ============================================================================

-- SELECT: Users involved in a pickup request can view location shares
CREATE POLICY "Donors can view location shares for their pickups" 
    ON active_location_shares FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM pickup_requests pr
            JOIN food_listings fl ON fl.id = pr.listing_id
            WHERE pr.id = active_location_shares.pickup_request_id 
            AND fl.donor_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'donor')
    );

CREATE POLICY "NGOs can view location shares for their pickups" 
    ON active_location_shares FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE pickup_requests.id = active_location_shares.pickup_request_id 
            AND pickup_requests.ngo_id = auth.uid()
        ) AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'ngo')
    );

-- INSERT: Anyone can create location shares (anonymous/public access)
CREATE POLICY "Anyone can create location shares" 
    ON active_location_shares FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE pickup_requests.id = active_location_shares.pickup_request_id 
            AND pickup_requests.status IN ('confirmed', 'in_transit')
        )
    );

-- UPDATE: Users can update their own location shares
CREATE POLICY "Users can update own location shares" 
    ON active_location_shares FOR UPDATE 
    USING (shared_by = auth.uid())
    WITH CHECK (shared_by = auth.uid());

-- DELETE: Users can delete their own location shares
CREATE POLICY "Users can delete own location shares" 
    ON active_location_shares FOR DELETE 
    USING (shared_by = auth.uid());

-- ============================================================================
-- RLS POLICIES: otp_verifications
-- ============================================================================

-- Enable RLS
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- SELECT: Service role can view all OTP records (for verification)
CREATE POLICY "Service role can view OTP records"
    ON otp_verifications FOR SELECT
    USING (auth.role() = 'service_role');

-- INSERT: Service role can create OTP records
CREATE POLICY "Service role can create OTP records"
    ON otp_verifications FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- DELETE: Service role can delete OTP records (after verification)
CREATE POLICY "Service role can delete OTP records"
    ON otp_verifications FOR DELETE
    USING (auth.role() = 'service_role');

-- Also allow anon to insert (for edge function calls with anon key)
CREATE POLICY "Anon can create OTP records"
    ON otp_verifications FOR INSERT
    WITH CHECK (TRUE);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate confirmation codes for pickup requests
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically generate confirmation code on pickup request
CREATE OR REPLACE FUNCTION set_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confirmation_code IS NULL THEN
        NEW.confirmation_code := generate_confirmation_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pickup_request_confirmation_code 
    BEFORE INSERT ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION set_confirmation_code();

-- Function to automatically update food listing status based on pickup requests
CREATE OR REPLACE FUNCTION update_listing_status_on_request()
RETURNS TRIGGER AS $$
BEGIN
    -- When a request is accepted, mark listing as pending
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        UPDATE food_listings 
        SET status = 'pending' 
        WHERE id = NEW.listing_id AND status = 'available';
    END IF;
    
    -- When a request is confirmed, mark listing as claimed
    IF NEW.status = 'confirmed' AND OLD.status IN ('pending', 'accepted') THEN
        UPDATE food_listings 
        SET status = 'claimed' 
        WHERE id = NEW.listing_id;
    END IF;
    
    -- When a pickup is completed, mark listing as picked up
    IF NEW.status = 'completed' AND OLD.status IN ('confirmed', 'in_transit') THEN
        UPDATE food_listings 
        SET status = 'picked_up' 
        WHERE id = NEW.listing_id;
    END IF;
    
    -- When a request is cancelled/rejected, mark listing back as available if no other active requests
    IF NEW.status IN ('cancelled', 'rejected', 'no_show') THEN
        UPDATE food_listings 
        SET status = 'available' 
        WHERE id = NEW.listing_id 
        AND NOT EXISTS (
            SELECT 1 FROM pickup_requests 
            WHERE listing_id = NEW.listing_id 
            AND status IN ('pending', 'accepted', 'confirmed', 'in_transit')
            AND id != NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listing_status_trigger 
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION update_listing_status_on_request();

-- Function to update profile statistics after completed pickups
CREATE OR REPLACE FUNCTION update_profile_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update donor statistics
        UPDATE profiles 
        SET total_donations_given = total_donations_given + 1
        WHERE id = (SELECT donor_id FROM food_listings WHERE id = NEW.listing_id);
        
        -- Update NGO statistics
        UPDATE profiles 
        SET total_donations_received = total_donations_received + 1
        WHERE id = NEW.ngo_id;
        
        -- Update ratings if provided
        IF NEW.donor_rating IS NOT NULL THEN
            UPDATE profiles 
            SET 
                rating_average = ((rating_average * rating_count) + NEW.donor_rating) / (rating_count + 1),
                rating_count = rating_count + 1
            WHERE id = (SELECT donor_id FROM food_listings WHERE id = NEW.listing_id);
        END IF;
        
        IF NEW.ngo_rating IS NOT NULL THEN
            UPDATE profiles 
            SET 
                rating_average = ((rating_average * rating_count) + NEW.ngo_rating) / (rating_count + 1),
                rating_count = rating_count + 1
            WHERE id = NEW.ngo_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_stats_trigger 
    AFTER UPDATE ON pickup_requests
    FOR EACH ROW EXECUTE FUNCTION update_profile_statistics();

-- ============================================================================
-- VIEWS: Convenient data access
-- ============================================================================

-- View for available food listings with donor info
CREATE OR REPLACE VIEW available_food_with_donor AS
SELECT 
    fl.*,
    p.full_name as donor_name,
    p.phone as donor_phone,
    p.rating_average as donor_rating,
    p.rating_count as donor_rating_count
FROM food_listings fl
JOIN profiles p ON fl.donor_id = p.id
WHERE fl.status = 'available' 
AND fl.available_until > NOW()
AND p.is_active = TRUE;

-- View for active pickup requests with full details
CREATE OR REPLACE VIEW active_pickups_detailed AS
SELECT 
    pr.*,
    fl.title as listing_title,
    fl.food_type,
    fl.pickup_address_line1,
    fl.pickup_city,
    donor.full_name as donor_name,
    donor.phone as donor_phone,
    ngo.full_name as ngo_name,
    ngo.phone as ngo_phone,
    nl.location_name as ngo_location_name,
    nl.address_line1 as ngo_address
FROM pickup_requests pr
JOIN food_listings fl ON pr.listing_id = fl.id
JOIN profiles donor ON fl.donor_id = donor.id
JOIN profiles ngo ON pr.ngo_id = ngo.id
LEFT JOIN ngo_locations nl ON pr.ngo_location_id = nl.id
WHERE pr.status IN ('pending', 'accepted', 'confirmed', 'in_transit');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_food_listings_status_available_location 
    ON food_listings(status, available_until, pickup_latitude, pickup_longitude) 
    WHERE status = 'available';

CREATE INDEX idx_pickup_requests_listing_status 
    ON pickup_requests(listing_id, status);

CREATE INDEX idx_pickup_requests_ngo_status 
    ON pickup_requests(ngo_id, status);

CREATE INDEX idx_messages_conversation_unread 
    ON messages(sender_id, recipient_id, is_read, created_at DESC) 
    WHERE is_deleted = FALSE;

-- ============================================================================
-- TABLE: otp_verifications
-- ============================================================================
-- Description: Store OTP codes for mobile number verification
-- ============================================================================

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_number TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_otp_verifications_mobile ON otp_verifications(mobile_number);
CREATE INDEX idx_otp_verifications_expires ON otp_verifications(expires_at);

COMMENT ON TABLE otp_verifications IS 'OTP codes for mobile number verification';
COMMENT ON COLUMN otp_verifications.expires_at IS 'When the OTP expires';

-- ============================================================================
-- CLEANUP AND MAINTENANCE
-- ============================================================================

-- Function to clean up old expired listings (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE food_listings 
    SET status = 'expired'
    WHERE status = 'available' 
    AND available_until < NOW();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to deactivate old location shares (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION deactivate_old_location_shares()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE active_location_shares 
    SET 
        is_active = FALSE,
        share_ended_at = NOW()
    WHERE is_active = TRUE 
    AND last_update_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS: Ensure authenticated users have access
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table permissions to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert sample comment for tracking
COMMENT ON SCHEMA public IS 'FoodBridge schema v1.0 - Complete database for food donation platform';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'FoodBridge schema migration completed successfully!';
    RAISE NOTICE 'Tables created: profiles, ngo_locations, food_listings, food_pickup_details, pickup_requests, messages, active_location_shares';
    RAISE NOTICE 'RLS policies enabled on all tables';
    RAISE NOTICE 'Automatic triggers configured for timestamps, status updates, and statistics';
    RAISE NOTICE 'Helper functions and views created';
END $$;
