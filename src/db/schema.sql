-- FarmGrid PostgreSQL / Supabase Database Schema
-- Agricultural Resource Coordination Under Scarcity

-- 1. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT NOT NULL,
  location_name TEXT,
  coord_x NUMERIC NOT NULL,
  coord_y NUMERIC NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  land_area_acres NUMERIC NOT NULL DEFAULT 2.0,
  primary_crop TEXT NOT NULL,
  active_crop_stage TEXT NOT NULL CHECK (active_crop_stage IN (
    'land_prep', 'sowing', 'vegetative', 'flowering', 'critical_ripening', 'immediate_harvest'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Resource Owners Table
CREATE TABLE IF NOT EXISTS resource_owners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT NOT NULL,
  organization TEXT,
  rating NUMERIC NOT NULL DEFAULT 4.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES resource_owners(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'Agricultural Machinery',
    'Irrigation Equipment',
    'Storage',
    'Transportation',
    'Agricultural Labour',
    'Specialized Services'
  )),
  sub_type TEXT NOT NULL,
  specifications TEXT NOT NULL,
  location_name TEXT NOT NULL,
  coord_x NUMERIC NOT NULL,
  coord_y NUMERIC NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  operating_start_hour INT NOT NULL DEFAULT 7,
  operating_end_hour INT NOT NULL DEFAULT 19,
  hourly_rate_est NUMERIC,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN (
    'available', 'booked', 'maintenance', 'disrupted'
  )),
  maintenance_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Resource Requests Table
CREATE TABLE IF NOT EXISTS resource_requests (
  id TEXT PRIMARY KEY,
  farmer_id TEXT REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  farm_location_name TEXT NOT NULL,
  farm_coord_x NUMERIC NOT NULL,
  farm_coord_y NUMERIC NOT NULL,
  resource_category TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  earliest_start TEXT NOT NULL,
  latest_end TEXT NOT NULL,
  duration_hours NUMERIC NOT NULL,
  crop_stage TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('standard', 'moderate', 'high', 'critical')),
  urgency_justification TEXT NOT NULL,
  weather_risk TEXT NOT NULL CHECK (weather_risk IN ('none', 'low', 'moderate', 'severe')),
  weather_note TEXT,
  queue_minutes_elapsed INT NOT NULL DEFAULT 0,
  priority_total_score INT NOT NULL CHECK (priority_total_score BETWEEN 0 AND 100),
  urgency_score INT NOT NULL,
  weather_risk_score INT NOT NULL,
  crop_stage_score INT NOT NULL,
  queue_waiting_score INT NOT NULL,
  distance_score INT NOT NULL,
  resource_constraints_score INT NOT NULL,
  decision_explanation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'allocated', 'conflict', 'disrupted', 'completed', 'cancelled'
  )),
  assigned_resource_id TEXT REFERENCES resources(id) ON DELETE SET NULL,
  assigned_resource_name TEXT,
  allocated_start_time TEXT,
  allocated_end_time TEXT,
  allocated_transit_mins INT,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending_sync')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES resource_requests(id) ON DELETE CASCADE,
  resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  farmer_id TEXT REFERENCES farmers(id) ON DELETE CASCADE,
  farmer_name TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  transit_start_time TEXT NOT NULL,
  transit_minutes INT NOT NULL DEFAULT 30,
  buffer_minutes INT NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN (
    'confirmed', 'disrupted', 'completed', 'reallocated'
  )),
  crop_stage TEXT NOT NULL,
  priority_score INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Disruptions Table
CREATE TABLE IF NOT EXISTS disruptions (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('machine_breakdown', 'heavy_rain', 'cancellation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_resource_id TEXT REFERENCES resources(id) ON DELETE SET NULL,
  affected_resource_name TEXT,
  affected_request_ids JSONB NOT NULL DEFAULT '[]',
  reallocations JSONB NOT NULL DEFAULT '[]'
);

-- Indices for rapid query performance
CREATE INDEX IF NOT EXISTS idx_requests_status ON resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON resource_requests(priority_total_score DESC);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_date ON bookings(resource_id, date);
