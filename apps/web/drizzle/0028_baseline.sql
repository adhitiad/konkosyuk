CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.accounts (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id uuid NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    expires_at timestamp without time zone,
    password text,
    scope text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ad_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    tier text NOT NULL,
    duration integer NOT NULL,
    price numeric(12,2) NOT NULL,
    position_type text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.app_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.balance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    related_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.booking_requests (
    id text NOT NULL,
    tenant_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    property_id uuid NOT NULL,
    num_occupants integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    agreed_price numeric(12,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    booking_type text NOT NULL,
    status text DEFAULT 'pending_dp'::text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_group_booking boolean DEFAULT false,
    group_booking_id uuid,
    pricing_rule_id uuid,
    base_price_at_booking numeric(12,2),
    security_deposit numeric(12,2),
    move_in_inspection_id uuid,
    move_out_inspection_id uuid,
    inspection_status text DEFAULT 'pending'::text NOT NULL
);

CREATE TABLE public.campus_areas (
    campus_area_id uuid DEFAULT gen_random_uuid() NOT NULL,
    campus_area_slug text NOT NULL,
    campus_area_name text NOT NULL,
    campus_area_image_key text NOT NULL,
    campus_area_property_count integer DEFAULT 0 NOT NULL,
    campus_area_sort_order integer DEFAULT 0 NOT NULL,
    campus_area_is_active boolean DEFAULT true NOT NULL,
    campus_area_created_at timestamp without time zone DEFAULT now() NOT NULL,
    campus_area_updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.chart_of_accounts (
    id text NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    account_type text NOT NULL,
    parent_account_id text,
    is_active boolean DEFAULT true
);

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    last_message_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.damage_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inspection_id uuid NOT NULL,
    item_id uuid,
    reported_by uuid NOT NULL,
    severity text NOT NULL,
    description text NOT NULL,
    estimated_cost numeric(12,2),
    actual_cost numeric(12,2),
    status text DEFAULT 'reported'::text,
    resolution text,
    resolved_by uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.feature_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    description text,
    enabled boolean DEFAULT false NOT NULL,
    rollout_percentage integer DEFAULT 100 NOT NULL,
    "allowedRoles" text[] DEFAULT '{}'::text[] NOT NULL,
    "allowedUsers" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.feedbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    category text NOT NULL,
    message text NOT NULL,
    rating integer,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.general_ledger (
    id text NOT NULL,
    transaction_date timestamp without time zone NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    description text NOT NULL,
    reference_type text,
    reference_id text,
    debit numeric(12,2) DEFAULT '0'::numeric,
    credit numeric(12,2) DEFAULT '0'::numeric,
    balance numeric(12,2),
    created_by uuid,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.group_booking_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_booking_id uuid NOT NULL,
    user_id uuid NOT NULL,
    share_percentage numeric(5,2) NOT NULL,
    share_amount numeric NOT NULL,
    paid_amount numeric DEFAULT '0'::numeric,
    status text DEFAULT 'invited'::text,
    joined_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.group_bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lead_user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    total_amount numeric NOT NULL,
    deposit_amount numeric NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.inspection_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inspection_id uuid NOT NULL,
    category text NOT NULL,
    item_name text NOT NULL,
    condition text,
    notes text,
    repair_cost numeric(12,2),
    photo_urls jsonb DEFAULT '[]'::jsonb,
    is_new_damage boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.inspection_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inspection_id uuid NOT NULL,
    item_id uuid,
    type text NOT NULL,
    url text NOT NULL,
    caption text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.inspection_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_type text NOT NULL,
    items jsonb NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.inspections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text,
    performed_by uuid NOT NULL,
    witness_id uuid,
    overall_condition text,
    notes text,
    damage_score numeric(5,2),
    estimated_repair_cost numeric(12,2),
    security_deposit numeric(12,2),
    refund_amount numeric(12,2),
    is_disputed boolean DEFAULT false,
    dispute_reason text,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.kyc_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    didit_session_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    document_type text,
    ktp_image_url text,
    selfie_image_url text,
    face_match_score numeric(5,2),
    liveness_passed boolean,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    didit_redirect_url text
);

CREATE TABLE public.loyalty_points (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    type text NOT NULL,
    source text,
    reference_id text,
    description text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    reference_id uuid,
    reference_type text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.maintenance_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid,
    category text NOT NULL,
    description text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    resolution_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.maintenance_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unit_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    priority text DEFAULT 'medium'::text NOT NULL,
    status text DEFAULT 'reported'::text NOT NULL,
    owner_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);

CREATE TABLE public.nearby_places (
    nearby_place_id uuid DEFAULT gen_random_uuid() NOT NULL,
    nearby_place_property_id uuid NOT NULL,
    nearby_place_name text NOT NULL,
    nearby_place_type text NOT NULL,
    nearby_place_distance integer NOT NULL,
    nearby_place_latitude numeric(10,8) NOT NULL,
    nearby_place_longitude numeric(10,8) NOT NULL,
    nearby_place_sort_order integer DEFAULT 0 NOT NULL,
    nearby_place_created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.neighborhood_insights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    category text NOT NULL,
    rating numeric(3,2),
    description text,
    source text DEFAULT 'tenant'::text,
    submitted_by uuid,
    is_verified boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.neighborhood_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    distance numeric(5,2),
    walking_minutes integer,
    latitude numeric(9,6),
    longitude numeric(9,6),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resend_api_key text,
    resend_from_email text,
    meta_access_token text,
    meta_phone_number_id text,
    meta_maintenance_created_template text,
    meta_maintenance_updated_template text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    reference_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.owner_bank_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    account_type text NOT NULL,
    provider_name text NOT NULL,
    account_number text NOT NULL,
    account_name text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_gateway_configs (
    id text NOT NULL,
    provider text NOT NULL,
    is_active boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    environment text DEFAULT 'sandbox'::text,
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.payment_gateway_credentials (
    id text NOT NULL,
    gateway_id text NOT NULL,
    encrypted_config jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payment_transactions (
    id text NOT NULL,
    invoice_number text NOT NULL,
    booking_id uuid,
    provider text NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    gateway_response jsonb,
    webhook_payload jsonb,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    property_id uuid,
    provider text NOT NULL,
    purpose text NOT NULL,
    amount text NOT NULL,
    currency text DEFAULT 'IDR'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    raw_response jsonb DEFAULT '{}'::jsonb,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.platform_settings (
    id text DEFAULT 'default'::text NOT NULL,
    platform_fee_percent numeric(5,2) DEFAULT 1.8,
    featured_listing_price numeric(12,2) DEFAULT '50000'::numeric,
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.popular_areas (
    popular_area_id uuid DEFAULT gen_random_uuid() NOT NULL,
    popular_area_slug text NOT NULL,
    popular_area_name text NOT NULL,
    popular_area_image_key text NOT NULL,
    popular_area_property_count integer DEFAULT 0 NOT NULL,
    popular_area_sort_order integer DEFAULT 0 NOT NULL,
    popular_area_is_active boolean DEFAULT true NOT NULL,
    popular_area_created_at timestamp without time zone DEFAULT now() NOT NULL,
    popular_area_updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pricing_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    month text NOT NULL,
    avg_occupancy numeric(5,2),
    avg_booking_value numeric(12,2),
    total_bookings integer DEFAULT 0,
    recommended_price numeric(12,2),
    recommended_adjustment numeric(5,2),
    confidence_score numeric(3,2),
    factors jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.pricing_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    rule_id uuid,
    suggested_value numeric(12,2) NOT NULL,
    reason text NOT NULL,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.properties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    address text NOT NULL,
    province text,
    city text,
    district text,
    type text NOT NULL,
    base_price text,
    packages jsonb DEFAULT '{"custom": {"unit": "days", "label": "Custom Duration", "enabled": false, "maxDuration": 365, "minDuration": 1, "pricePerUnit": 0}, "predefined": []}'::jsonb NOT NULL,
    status text DEFAULT 'aktif'::text NOT NULL,
    amenities jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    images jsonb DEFAULT '[]'::jsonb,
    latitude numeric(9,6),
    longitude numeric(9,6),
    is_active boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false,
    gps_verified boolean DEFAULT false NOT NULL,
    featured_until timestamp without time zone,
    ical_export_token text,
    ical_import_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.property_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid,
    advertiser_name text NOT NULL,
    advertiser_phone text NOT NULL,
    advertiser_whatsapp text,
    title text NOT NULL,
    description text NOT NULL,
    image_url text NOT NULL,
    target_url text,
    location text NOT NULL,
    price text,
    type text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    start_date timestamp without time zone DEFAULT now() NOT NULL,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    package_id uuid,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp without time zone,
    admin_note text
);

CREATE TABLE public.property_comparisons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_ids jsonb NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.property_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    average_rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    cleanliness numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    security numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    accuracy numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    communication numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    value_for_money numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    rating_distribution jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.property_rules (
    property_rules_id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_rule_property_id uuid NOT NULL,
    property_rule_text text NOT NULL,
    property_rule_type text DEFAULT 'general'::text NOT NULL,
    property_rule_sort_order integer DEFAULT 0 NOT NULL,
    property_rule_created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.property_tags (
    property_id uuid NOT NULL,
    tag_id uuid NOT NULL
);

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referee_id uuid,
    code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'tenant'::text NOT NULL,
    property_id uuid,
    base_amount numeric(12,2) DEFAULT '0'::numeric,
    commission_rate numeric(5,2) DEFAULT '0'::numeric,
    commission_amount numeric(12,2) DEFAULT '0'::numeric,
    referee_transaction_id uuid,
    eligible_at timestamp without time zone,
    payout_scheduled_at timestamp without time zone,
    voucher_code text,
    offset_applied boolean DEFAULT false,
    tier integer DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    completed_at timestamp without time zone
);

CREATE TABLE public.refund_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid NOT NULL,
    payment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    amount text NOT NULL,
    approved_amount text,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp without time zone,
    review_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.review_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_by_id uuid NOT NULL,
    reviewed_user_id uuid,
    property_id uuid,
    type text NOT NULL,
    rating numeric(3,2) NOT NULL,
    comment text NOT NULL,
    booking_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    cleanliness numeric(3,2) NOT NULL,
    security numeric(3,2) NOT NULL,
    accuracy numeric(3,2) NOT NULL,
    communication numeric(3,2) NOT NULL,
    value_for_money numeric(3,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    helpful_count integer DEFAULT 0 NOT NULL,
    reply_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    points_used integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    points_cost integer NOT NULL,
    value numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.room_facilities (
    room_facility_id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_facility_unit_id uuid NOT NULL,
    room_facility_category text NOT NULL,
    room_facility_name text NOT NULL,
    room_facility_icon text DEFAULT 'circle-dot'::text NOT NULL,
    room_facility_sort_order integer DEFAULT 0 NOT NULL,
    room_facility_created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.roommate_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    budget_min numeric(12,2),
    budget_max numeric(12,2),
    preferred_location text,
    move_in_date timestamp without time zone,
    duration text,
    lifestyle jsonb DEFAULT '{}'::jsonb,
    bio text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.saved_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    filters jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_matched_at timestamp without time zone,
    last_notified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.seasonal_pricing_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    unit_id uuid,
    name text NOT NULL,
    rule_type text DEFAULT 'percentage'::text NOT NULL,
    adjustment_value numeric(12,2) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    min_nights integer,
    max_nights integer,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.sessions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id uuid NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."twoFactor" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id uuid NOT NULL,
    secret text NOT NULL,
    backup_codes text NOT NULL,
    verified boolean DEFAULT true NOT NULL,
    failed_verification_count integer DEFAULT 0,
    locked_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.unit_pricing_tiers (
    id text NOT NULL,
    unit_id uuid NOT NULL,
    max_occupants integer NOT NULL,
    price numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    property_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(12,2) NOT NULL,
    capacity text,
    size text,
    status text DEFAULT 'available'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    room_size text,
    electricity_included boolean DEFAULT false NOT NULL,
    furniture_included boolean DEFAULT false NOT NULL
);

CREATE TABLE public.user_contracts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    booking_id uuid NOT NULL,
    property_id uuid NOT NULL,
    contract_url text NOT NULL,
    contract_status text DEFAULT 'generated'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
    email_digest text DEFAULT 'immediate'::text NOT NULL,
    quiet_hours_start text,
    quiet_hours_end text,
    timezone text DEFAULT 'Asia/Jakarta'::text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    image text,
    phone text,
    whatsapp text,
    telegram text,
    role text DEFAULT 'cust'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_banned boolean DEFAULT false NOT NULL,
    ban_reason text,
    kyc_status text DEFAULT 'none'::text NOT NULL,
    ktp_number text,
    ktp_image_url text,
    reputation_score numeric(4,2) DEFAULT 0.00 NOT NULL,
    balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    province text,
    city text,
    district text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    two_factor_enabled boolean DEFAULT false,
    referral_code text,
    referred_by uuid,
    loyalty_tier text DEFAULT 'bronze'::text NOT NULL,
    total_referrals integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.verifications (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.webhook_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider text NOT NULL,
    event_id text NOT NULL,
    event_type text,
    payload jsonb NOT NULL,
    signature_valid boolean DEFAULT false,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    payload_hash text,
    details jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE public.wishlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    property_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.withdrawals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    bank_account_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    admin_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.ad_packages
    ADD CONSTRAINT ad_packages_name_unique UNIQUE (name);

ALTER TABLE ONLY public.ad_packages
    ADD CONSTRAINT ad_packages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_key_unique UNIQUE (key);

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT app_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.balance_logs
    ADD CONSTRAINT balance_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.campus_areas
    ADD CONSTRAINT campus_areas_campus_area_slug_unique UNIQUE (campus_area_slug);

ALTER TABLE ONLY public.campus_areas
    ADD CONSTRAINT campus_areas_pkey PRIMARY KEY (campus_area_id);

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_account_code_unique UNIQUE (account_code);

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_tenant_owner_unique UNIQUE (tenant_id, owner_id);

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_property_unique UNIQUE (user_id, property_id);

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_key_unique UNIQUE (key);

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.general_ledger
    ADD CONSTRAINT general_ledger_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_booking_members
    ADD CONSTRAINT group_booking_members_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_bookings
    ADD CONSTRAINT group_bookings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inspection_photos
    ADD CONSTRAINT inspection_photos_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inspection_templates
    ADD CONSTRAINT inspection_templates_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_didit_session_id_unique UNIQUE (didit_session_id);

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.maintenance_reports
    ADD CONSTRAINT maintenance_reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.nearby_places
    ADD CONSTRAINT nearby_places_pkey PRIMARY KEY (nearby_place_id);

ALTER TABLE ONLY public.neighborhood_insights
    ADD CONSTRAINT neighborhood_insights_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.neighborhood_places
    ADD CONSTRAINT neighborhood_places_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.owner_bank_accounts
    ADD CONSTRAINT owner_bank_accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT payment_gateway_configs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_gateway_credentials
    ADD CONSTRAINT payment_gateway_credentials_gateway_id_unique UNIQUE (gateway_id);

ALTER TABLE ONLY public.payment_gateway_credentials
    ADD CONSTRAINT payment_gateway_credentials_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_invoice_number_unique UNIQUE (invoice_number);

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.popular_areas
    ADD CONSTRAINT popular_areas_pkey PRIMARY KEY (popular_area_id);

ALTER TABLE ONLY public.popular_areas
    ADD CONSTRAINT popular_areas_popular_area_slug_unique UNIQUE (popular_area_slug);

ALTER TABLE ONLY public.pricing_analytics
    ADD CONSTRAINT pricing_analytics_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.pricing_suggestions
    ADD CONSTRAINT pricing_suggestions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_ical_export_token_unique UNIQUE (ical_export_token);

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.property_ads
    ADD CONSTRAINT property_ads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.property_comparisons
    ADD CONSTRAINT property_comparisons_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.property_ratings
    ADD CONSTRAINT property_ratings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.property_ratings
    ADD CONSTRAINT property_ratings_property_id_unique UNIQUE (property_id);

ALTER TABLE ONLY public.property_rules
    ADD CONSTRAINT property_rules_pkey PRIMARY KEY (property_rules_id);

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_user_unique UNIQUE (property_id, created_by_id);

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.room_facilities
    ADD CONSTRAINT room_facilities_pkey PRIMARY KEY (room_facility_id);

ALTER TABLE ONLY public.room_facilities
    ADD CONSTRAINT room_facilities_unit_category_name_unique UNIQUE (room_facility_unit_id, room_facility_category, room_facility_name);

ALTER TABLE ONLY public.roommate_preferences
    ADD CONSTRAINT roommate_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.roommate_preferences
    ADD CONSTRAINT roommate_preferences_user_id_unique UNIQUE (user_id);

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.seasonal_pricing_rules
    ADD CONSTRAINT seasonal_pricing_rules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_unique UNIQUE (name);

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public."twoFactor"
    ADD CONSTRAINT "twoFactor_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY public.unit_pricing_tiers
    ADD CONSTRAINT unit_pricing_tiers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_name_unique UNIQUE (property_id, name);

ALTER TABLE ONLY public.user_contracts
    ADD CONSTRAINT user_contracts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_unique UNIQUE (referral_code);

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_provider_event_id_unique UNIQUE (provider, event_id);

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_property_unique UNIQUE (user_id, property_id);

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_pkey PRIMARY KEY (id);

CREATE INDEX accounts_provider_idx ON public.accounts USING btree (provider_id, account_id);

CREATE INDEX accounts_user_id_idx ON public.accounts USING btree (user_id);

CREATE INDEX app_settings_key_idx ON public.app_settings USING btree (key);

CREATE INDEX balance_logs_created_at_idx ON public.balance_logs USING btree (created_at);

CREATE INDEX balance_logs_type_idx ON public.balance_logs USING btree (type);

CREATE INDEX balance_logs_user_id_idx ON public.balance_logs USING btree (user_id);

CREATE INDEX booking_requests_property_id_idx ON public.booking_requests USING btree (property_id);

CREATE INDEX booking_requests_status_idx ON public.booking_requests USING btree (status);

CREATE INDEX booking_requests_tenant_id_idx ON public.booking_requests USING btree (tenant_id);

CREATE INDEX booking_requests_unit_id_idx ON public.booking_requests USING btree (unit_id);

CREATE INDEX bookings_property_id_idx ON public.bookings USING btree (property_id);

CREATE INDEX bookings_property_status_created_idx ON public.bookings USING btree (property_id, status, created_at);

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);

CREATE INDEX bookings_unit_id_idx ON public.bookings USING btree (unit_id);

CREATE INDEX bookings_user_id_idx ON public.bookings USING btree (user_id);

CREATE INDEX bookings_user_status_created_idx ON public.bookings USING btree (user_id, status, created_at);

CREATE INDEX chat_rooms_last_message_at_idx ON public.chat_rooms USING btree (last_message_at);

CREATE INDEX chat_rooms_owner_id_idx ON public.chat_rooms USING btree (owner_id);

CREATE INDEX chat_rooms_property_id_idx ON public.chat_rooms USING btree (property_id);

CREATE INDEX chat_rooms_tenant_id_idx ON public.chat_rooms USING btree (tenant_id);

CREATE INDEX favorites_property_id_idx ON public.favorites USING btree (property_id);

CREATE INDEX favorites_user_id_idx ON public.favorites USING btree (user_id);

CREATE UNIQUE INDEX feature_flags_key_idx ON public.feature_flags USING btree (key);

CREATE INDEX feedbacks_category_idx ON public.feedbacks USING btree (category);

CREATE INDEX feedbacks_status_idx ON public.feedbacks USING btree (status);

CREATE INDEX feedbacks_user_id_idx ON public.feedbacks USING btree (user_id);

CREATE INDEX idx_ad_packages_active ON public.ad_packages USING btree (is_active);

CREATE INDEX idx_ad_packages_tier ON public.ad_packages USING btree (tier);

CREATE INDEX idx_nearby_places_property ON public.nearby_places USING btree (nearby_place_property_id);

CREATE INDEX idx_nearby_places_type ON public.nearby_places USING btree (nearby_place_type);

CREATE INDEX idx_properties_coords ON public.properties USING btree (latitude, longitude);

CREATE INDEX idx_property_ads_active ON public.property_ads USING btree (is_active);

CREATE INDEX idx_property_ads_dates ON public.property_ads USING btree (start_date, end_date);

CREATE INDEX idx_property_ads_package_id ON public.property_ads USING btree (package_id);

CREATE INDEX idx_property_ads_paid_at ON public.property_ads USING btree (paid_at);

CREATE INDEX idx_property_ads_payment_status ON public.property_ads USING btree (payment_status);

CREATE INDEX idx_property_ads_position ON public.property_ads USING btree ("position");

CREATE INDEX idx_property_rules_property ON public.property_rules USING btree (property_rule_property_id);

CREATE INDEX idx_room_facilities_category ON public.room_facilities USING btree (room_facility_category);

CREATE INDEX idx_room_facilities_unit ON public.room_facilities USING btree (room_facility_unit_id);

CREATE INDEX kyc_verifications_didit_session_id_idx ON public.kyc_verifications USING btree (didit_session_id);

CREATE INDEX kyc_verifications_status_idx ON public.kyc_verifications USING btree (status);

CREATE INDEX kyc_verifications_user_id_idx ON public.kyc_verifications USING btree (user_id);

CREATE INDEX loyalty_transactions_user_id_idx ON public.loyalty_transactions USING btree (user_id);

CREATE INDEX maintenance_reports_property_id_idx ON public.maintenance_reports USING btree (property_id);

CREATE INDEX maintenance_reports_status_idx ON public.maintenance_reports USING btree (status);

CREATE INDEX maintenance_reports_tenant_id_idx ON public.maintenance_reports USING btree (tenant_id);

CREATE INDEX maintenance_tickets_priority_idx ON public.maintenance_tickets USING btree (priority);

CREATE INDEX maintenance_tickets_status_idx ON public.maintenance_tickets USING btree (status);

CREATE INDEX maintenance_tickets_tenant_id_idx ON public.maintenance_tickets USING btree (tenant_id);

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);

CREATE INDEX messages_room_id_idx ON public.messages USING btree (room_id);

CREATE INDEX messages_sender_id_idx ON public.messages USING btree (sender_id);

CREATE INDEX notification_settings_created_at_idx ON public.notification_settings USING btree (created_at);

CREATE INDEX notifications_is_read_idx ON public.notifications USING btree (is_read);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);

CREATE INDEX owner_bank_accounts_account_type_idx ON public.owner_bank_accounts USING btree (account_type);

CREATE INDEX owner_bank_accounts_owner_id_idx ON public.owner_bank_accounts USING btree (owner_id);

CREATE INDEX payments_booking_id_idx ON public.payments USING btree (booking_id);

CREATE INDEX payments_property_id_idx ON public.payments USING btree (property_id);

CREATE INDEX payments_provider_idx ON public.payments USING btree (provider);

CREATE INDEX payments_status_idx ON public.payments USING btree (status);

CREATE INDEX properties_amenities_gin_idx ON public.properties USING gin (amenities);

CREATE INDEX properties_city_idx ON public.properties USING btree (city);

CREATE INDEX properties_is_active_idx ON public.properties USING btree (is_active);

CREATE INDEX properties_metadata_gin_idx ON public.properties USING gin (metadata);

CREATE INDEX properties_owner_active_created_idx ON public.properties USING btree (owner_id, is_active, created_at);

CREATE INDEX properties_owner_id_idx ON public.properties USING btree (owner_id);

CREATE INDEX properties_province_idx ON public.properties USING btree (province);

CREATE INDEX properties_status_idx ON public.properties USING btree (status);

CREATE INDEX properties_type_idx ON public.properties USING btree (type);

CREATE INDEX property_tags_pk ON public.property_tags USING btree (property_id, tag_id);

CREATE UNIQUE INDEX push_subscriptions_endpoint_idx ON public.push_subscriptions USING btree (endpoint);

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);

CREATE UNIQUE INDEX referrals_code_idx ON public.referrals USING btree (code);

CREATE INDEX referrals_referee_id_idx ON public.referrals USING btree (referee_id);

CREATE INDEX referrals_referrer_id_idx ON public.referrals USING btree (referrer_id);

CREATE INDEX refund_requests_booking_id_idx ON public.refund_requests USING btree (booking_id);

CREATE INDEX refund_requests_payment_id_idx ON public.refund_requests USING btree (payment_id);

CREATE INDEX refund_requests_status_idx ON public.refund_requests USING btree (status);

CREATE INDEX refund_requests_user_id_idx ON public.refund_requests USING btree (user_id);

CREATE INDEX review_replies_review_id_idx ON public.review_replies USING btree (review_id);

CREATE INDEX review_replies_user_id_idx ON public.review_replies USING btree (user_id);

CREATE INDEX reviews_booking_id_idx ON public.reviews USING btree (booking_id);

CREATE INDEX reviews_created_by_id_idx ON public.reviews USING btree (created_by_id);

CREATE INDEX reviews_property_id_idx ON public.reviews USING btree (property_id);

CREATE INDEX reviews_rating_idx ON public.reviews USING btree (rating);

CREATE INDEX reviews_reviewed_user_id_idx ON public.reviews USING btree (reviewed_user_id);

CREATE INDEX reviews_status_idx ON public.reviews USING btree (status);

CREATE INDEX reviews_type_idx ON public.reviews USING btree (type);

CREATE INDEX reward_redemptions_user_id_idx ON public.reward_redemptions USING btree (user_id);

CREATE INDEX saved_searches_active_idx ON public.saved_searches USING btree (is_active);

CREATE INDEX saved_searches_user_id_idx ON public.saved_searches USING btree (user_id);

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);

CREATE INDEX two_factor_secret_idx ON public."twoFactor" USING btree (secret);

CREATE INDEX two_factor_user_id_idx ON public."twoFactor" USING btree (user_id);

CREATE INDEX unit_pricing_tiers_unit_id_idx ON public.unit_pricing_tiers USING btree (unit_id);

CREATE INDEX units_property_id_idx ON public.units USING btree (property_id);

CREATE INDEX units_property_status_created_idx ON public.units USING btree (property_id, status, created_at);

CREATE INDEX units_status_idx ON public.units USING btree (status);

CREATE INDEX user_contracts_booking_id_idx ON public.user_contracts USING btree (booking_id);

CREATE INDEX user_contracts_property_id_idx ON public.user_contracts USING btree (property_id);

CREATE INDEX user_contracts_user_id_idx ON public.user_contracts USING btree (user_id);

CREATE UNIQUE INDEX user_notification_preferences_user_id_idx ON public.user_notification_preferences USING btree (user_id);

CREATE INDEX users_is_active_idx ON public.users USING btree (is_active);

CREATE INDEX verifications_identifier_idx ON public.verifications USING btree (identifier);

CREATE INDEX webhook_events_payload_hash_idx ON public.webhook_events USING btree (payload_hash);

CREATE INDEX webhook_events_provider_idx ON public.webhook_events USING btree (provider);

CREATE INDEX wishlists_property_id_idx ON public.wishlists USING btree (property_id);

CREATE INDEX wishlists_user_id_idx ON public.wishlists USING btree (user_id);

CREATE INDEX withdrawals_bank_account_id_idx ON public.withdrawals USING btree (bank_account_id);

CREATE INDEX withdrawals_owner_id_idx ON public.withdrawals USING btree (owner_id);

CREATE INDEX withdrawals_status_idx ON public.withdrawals USING btree (status);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.balance_logs
    ADD CONSTRAINT balance_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_tenant_id_users_id_fk FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.booking_requests
    ADD CONSTRAINT booking_requests_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_group_booking_id_group_bookings_id_fk FOREIGN KEY (group_booking_id) REFERENCES public.group_bookings(id);

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pricing_rule_id_seasonal_pricing_rules_id_fk FOREIGN KEY (pricing_rule_id) REFERENCES public.seasonal_pricing_rules(id);

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chart_of_accounts
    ADD CONSTRAINT chart_of_accounts_parent_account_id_chart_of_accounts_id_fk FOREIGN KEY (parent_account_id) REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_tenant_id_users_id_fk FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_inspection_id_inspections_id_fk FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_item_id_inspection_items_id_fk FOREIGN KEY (item_id) REFERENCES public.inspection_items(id);

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_reported_by_users_id_fk FOREIGN KEY (reported_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.feedbacks
    ADD CONSTRAINT feedbacks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.general_ledger
    ADD CONSTRAINT general_ledger_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.group_booking_members
    ADD CONSTRAINT group_booking_members_group_booking_id_group_bookings_id_fk FOREIGN KEY (group_booking_id) REFERENCES public.group_bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_booking_members
    ADD CONSTRAINT group_booking_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_bookings
    ADD CONSTRAINT group_bookings_lead_user_id_users_id_fk FOREIGN KEY (lead_user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.group_bookings
    ADD CONSTRAINT group_bookings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);

ALTER TABLE ONLY public.group_bookings
    ADD CONSTRAINT group_bookings_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id);

ALTER TABLE ONLY public.inspection_items
    ADD CONSTRAINT inspection_items_inspection_id_inspections_id_fk FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inspection_photos
    ADD CONSTRAINT inspection_photos_inspection_id_inspections_id_fk FOREIGN KEY (inspection_id) REFERENCES public.inspections(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inspection_photos
    ADD CONSTRAINT inspection_photos_item_id_inspection_items_id_fk FOREIGN KEY (item_id) REFERENCES public.inspection_items(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_performed_by_users_id_fk FOREIGN KEY (performed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT inspections_witness_id_users_id_fk FOREIGN KEY (witness_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.kyc_verifications
    ADD CONSTRAINT kyc_verifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.loyalty_points
    ADD CONSTRAINT loyalty_points_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.maintenance_reports
    ADD CONSTRAINT maintenance_reports_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.maintenance_reports
    ADD CONSTRAINT maintenance_reports_tenant_id_users_id_fk FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.maintenance_reports
    ADD CONSTRAINT maintenance_reports_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_tenant_id_users_id_fk FOREIGN KEY (tenant_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_room_id_chat_rooms_id_fk FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.nearby_places
    ADD CONSTRAINT nearby_places_nearby_place_property_id_properties_id_fk FOREIGN KEY (nearby_place_property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.neighborhood_insights
    ADD CONSTRAINT neighborhood_insights_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.neighborhood_insights
    ADD CONSTRAINT neighborhood_insights_submitted_by_users_id_fk FOREIGN KEY (submitted_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.neighborhood_places
    ADD CONSTRAINT neighborhood_places_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.owner_bank_accounts
    ADD CONSTRAINT owner_bank_accounts_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payment_gateway_credentials
    ADD CONSTRAINT payment_gateway_credentials_gateway_id_payment_gateway_configs_ FOREIGN KEY (gateway_id) REFERENCES public.payment_gateway_configs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pricing_analytics
    ADD CONSTRAINT pricing_analytics_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pricing_suggestions
    ADD CONSTRAINT pricing_suggestions_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pricing_suggestions
    ADD CONSTRAINT pricing_suggestions_rule_id_seasonal_pricing_rules_id_fk FOREIGN KEY (rule_id) REFERENCES public.seasonal_pricing_rules(id);

ALTER TABLE ONLY public.properties
    ADD CONSTRAINT properties_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.property_ads
    ADD CONSTRAINT property_ads_package_id_ad_packages_id_fk FOREIGN KEY (package_id) REFERENCES public.ad_packages(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.property_ads
    ADD CONSTRAINT property_ads_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.property_comparisons
    ADD CONSTRAINT property_comparisons_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.property_ratings
    ADD CONSTRAINT property_ratings_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.property_rules
    ADD CONSTRAINT property_rules_property_rule_property_id_properties_id_fk FOREIGN KEY (property_rule_property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.property_tags
    ADD CONSTRAINT property_tags_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.property_tags
    ADD CONSTRAINT property_tags_tag_id_tags_id_fk FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id);

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referee_id_users_id_fk FOREIGN KEY (referee_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_users_id_fk FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_payment_id_payments_id_fk FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_reviewed_by_users_id_fk FOREIGN KEY (reviewed_by) REFERENCES public.users(id);

ALTER TABLE ONLY public.refund_requests
    ADD CONSTRAINT refund_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_review_id_reviews_id_fk FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.review_replies
    ADD CONSTRAINT review_replies_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewed_user_id_users_id_fk FOREIGN KEY (reviewed_user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_reward_id_rewards_id_fk FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.room_facilities
    ADD CONSTRAINT room_facilities_room_facility_unit_id_units_id_fk FOREIGN KEY (room_facility_unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.roommate_preferences
    ADD CONSTRAINT roommate_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.seasonal_pricing_rules
    ADD CONSTRAINT seasonal_pricing_rules_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.seasonal_pricing_rules
    ADD CONSTRAINT seasonal_pricing_rules_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public."twoFactor"
    ADD CONSTRAINT "twoFactor_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.unit_pricing_tiers
    ADD CONSTRAINT unit_pricing_tiers_unit_id_units_id_fk FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_contracts
    ADD CONSTRAINT user_contracts_booking_id_bookings_id_fk FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_contracts
    ADD CONSTRAINT user_contracts_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_contracts
    ADD CONSTRAINT user_contracts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_notification_preferences
    ADD CONSTRAINT user_notification_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_property_id_properties_id_fk FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.wishlists
    ADD CONSTRAINT wishlists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_bank_account_id_owner_bank_accounts_id_fk FOREIGN KEY (bank_account_id) REFERENCES public.owner_bank_accounts(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.withdrawals
    ADD CONSTRAINT withdrawals_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
