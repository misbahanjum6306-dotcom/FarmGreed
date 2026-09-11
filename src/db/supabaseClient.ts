import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  FarmerProfile,
  ResourceOwnerProfile,
  ResourceItem,
  ResourceRequest,
  Booking,
  DisruptionEvent,
} from '../types';

// Lazy client initialization without crashing if keys are not present
let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  return Boolean(url && anonKey && (url.startsWith('https://') || url.startsWith('http://')));
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }

  return null;
}

export const LOCAL_STORAGE_KEY = 'farmgrid_system_state_v1';
export const OFFLINE_QUEUE_KEY = 'farmgrid_offline_queue_v1';

export function loadLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
    return fallback;
  }
}

export function saveLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
}

// ----------------------------------------------------------------------------
// Row Mappers: Database Snake_Case <-> App CamelCase
// ----------------------------------------------------------------------------

export function mapFarmerFromDb(row: any): FarmerProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    village: row.village,
    location: {
      name: row.location_name || `${row.village} Farm`,
      village: row.village,
      x: Number(row.coord_x ?? 50),
      y: Number(row.coord_y ?? 50),
      lat: Number(row.latitude ?? 18.5204),
      lng: Number(row.longitude ?? 73.8567),
    },
    landAreaAcres: Number(row.land_area_acres ?? 2),
    primaryCrop: row.primary_crop,
    activeCropStage: row.active_crop_stage,
  };
}

export function mapFarmerToDb(f: FarmerProfile) {
  return {
    id: f.id,
    name: f.name,
    phone: f.phone,
    village: f.village,
    location_name: f.location.name,
    coord_x: f.location.x,
    coord_y: f.location.y,
    latitude: f.location.lat,
    longitude: f.location.lng,
    land_area_acres: f.landAreaAcres,
    primary_crop: f.primaryCrop,
    active_crop_stage: f.activeCropStage,
  };
}

export function mapResourceOwnerFromDb(row: any): ResourceOwnerProfile {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    village: row.village,
    organization: row.organization || undefined,
    rating: Number(row.rating ?? 4.5),
  };
}

export function mapResourceOwnerToDb(o: ResourceOwnerProfile) {
  return {
    id: o.id,
    name: o.name,
    phone: o.phone,
    village: o.village,
    organization: o.organization || null,
    rating: o.rating,
  };
}

export function mapResourceFromDb(row: any): ResourceItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    name: row.name,
    category: row.category,
    subType: row.sub_type,
    specifications: row.specifications,
    location: {
      name: row.location_name || 'Depot',
      village: row.location_name || 'Central Hub',
      x: Number(row.coord_x ?? 50),
      y: Number(row.coord_y ?? 50),
      lat: Number(row.latitude ?? 18.5204),
      lng: Number(row.longitude ?? 73.8567),
    },
    operatingWindow: {
      startHour: Number(row.operating_start_hour ?? 7),
      endHour: Number(row.operating_end_hour ?? 19),
    },
    hourlyRateEst: row.hourly_rate_est ? Number(row.hourly_rate_est) : undefined,
    status: row.status,
    maintenanceReason: row.maintenance_reason || undefined,
  };
}

export function mapResourceToDb(r: ResourceItem) {
  return {
    id: r.id,
    owner_id: r.ownerId,
    owner_name: r.ownerName,
    name: r.name,
    category: r.category,
    sub_type: r.subType,
    specifications: r.specifications,
    location_name: r.location.name,
    coord_x: r.location.x,
    coord_y: r.location.y,
    latitude: r.location.lat,
    longitude: r.location.lng,
    operating_start_hour: r.operatingWindow.startHour,
    operating_end_hour: r.operatingWindow.endHour,
    hourly_rate_est: r.hourlyRateEst || null,
    status: r.status,
    maintenance_reason: r.maintenanceReason || null,
  };
}

export function mapRequestFromDb(row: any): ResourceRequest {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    farmLocation: {
      name: row.farm_location_name || 'Farm',
      village: row.farm_location_name || 'Village',
      x: Number(row.farm_coord_x ?? 50),
      y: Number(row.farm_coord_y ?? 50),
      lat: 18.5204,
      lng: 73.8567,
    },
    resourceCategory: row.resource_category,
    resourceType: row.resource_type,
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : '2026-09-11',
    earliestStart: row.earliest_start,
    latestEnd: row.latest_end,
    durationHours: Number(row.duration_hours ?? 2),
    cropStage: row.crop_stage,
    urgency: row.urgency,
    urgencyJustification: row.urgency_justification || '',
    weatherRisk: row.weather_risk,
    weatherNote: row.weather_note || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    queueMinutesElapsed: Number(row.queue_minutes_elapsed ?? 0),
    priorityScore: {
      urgencyScore: Number(row.urgency_score ?? 0),
      weatherRiskScore: Number(row.weather_risk_score ?? 0),
      cropStageScore: Number(row.crop_stage_score ?? 0),
      queueWaitingScore: Number(row.queue_waiting_score ?? 0),
      distanceScore: Number(row.distance_score ?? 0),
      resourceConstraintsScore: Number(row.resource_constraints_score ?? 0),
      totalScore: Number(row.priority_total_score ?? 50),
      reasons: [],
    },
    status: row.status,
    assignedResourceId: row.assigned_resource_id || undefined,
    assignedResourceName: row.assigned_resource_name || undefined,
    allocatedSlot:
      row.allocated_start_time && row.allocated_end_time
        ? {
            resourceId: row.assigned_resource_id || '',
            resourceName: row.assigned_resource_name || '',
            date: typeof row.date === 'string' ? row.date.slice(0, 10) : '2026-09-11',
            startTime: row.allocated_start_time,
            endTime: row.allocated_end_time,
            transitStartTime: '07:30',
            transitEndTime: row.allocated_start_time,
            transitMinutes: Number(row.allocated_transit_mins ?? 30),
            bufferMinutes: 15,
          }
        : undefined,
    decisionExplanation: row.decision_explanation || '',
    syncStatus: row.sync_status === 'pending_sync' ? 'pending_sync' : 'synced',
  };
}

export function mapRequestToDb(req: ResourceRequest) {
  return {
    id: req.id,
    farmer_id: req.farmerId,
    farmer_name: req.farmerName,
    farm_location_name: req.farmLocation.name,
    farm_coord_x: req.farmLocation.x,
    farm_coord_y: req.farmLocation.y,
    resource_category: req.resourceCategory,
    resource_type: req.resourceType,
    date: req.date,
    earliest_start: req.earliestStart,
    latest_end: req.latestEnd,
    duration_hours: req.durationHours,
    crop_stage: req.cropStage,
    urgency: req.urgency,
    urgency_justification: req.urgencyJustification,
    weather_risk: req.weatherRisk,
    weather_note: req.weatherNote || null,
    queue_minutes_elapsed: req.queueMinutesElapsed,
    priority_total_score: req.priorityScore.totalScore,
    urgency_score: req.priorityScore.urgencyScore,
    weather_risk_score: req.priorityScore.weatherRiskScore,
    crop_stage_score: req.priorityScore.cropStageScore,
    queue_waiting_score: req.priorityScore.queueWaitingScore,
    distance_score: req.priorityScore.distanceScore,
    resource_constraints_score: req.priorityScore.resourceConstraintsScore,
    decision_explanation: req.decisionExplanation,
    status: req.status,
    assigned_resource_id: req.assignedResourceId || null,
    assigned_resource_name: req.assignedResourceName || null,
    allocated_start_time: req.allocatedSlot?.startTime || null,
    allocated_end_time: req.allocatedSlot?.endTime || null,
    allocated_transit_mins: req.allocatedSlot?.transitMinutes || 0,
    sync_status: req.syncStatus,
  };
}

export function mapBookingFromDb(row: any): Booking {
  return {
    id: row.id,
    requestId: row.request_id,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    farmerId: row.farmer_id,
    farmerName: row.farmer_name,
    farmLocation: {
      name: `${row.farmer_name}'s Farm`,
      village: 'Regional Valley',
      x: 50,
      y: 50,
      lat: 18.5204,
      lng: 73.8567,
    },
    date: typeof row.date === 'string' ? row.date.slice(0, 10) : '2026-09-11',
    startTime: row.start_time,
    endTime: row.end_time,
    transitStartTime: row.transit_start_time || '07:30',
    transitMinutes: Number(row.transit_minutes ?? 30),
    bufferMinutes: Number(row.buffer_minutes ?? 15),
    status: row.status,
    cropStage: row.crop_stage,
    priorityScore: Number(row.priority_score ?? 75),
  };
}

export function mapBookingToDb(b: Booking) {
  return {
    id: b.id,
    request_id: b.requestId,
    resource_id: b.resourceId,
    resource_name: b.resourceName,
    farmer_id: b.farmerId,
    farmer_name: b.farmerName,
    date: b.date,
    start_time: b.startTime,
    end_time: b.endTime,
    transit_start_time: b.transitStartTime,
    transit_minutes: b.transitMinutes,
    buffer_minutes: b.bufferMinutes,
    status: b.status,
    crop_stage: b.cropStage,
    priority_score: b.priorityScore,
  };
}

export function mapDisruptionFromDb(row: any): DisruptionEvent {
  return {
    id: row.id,
    timestamp: row.timestamp || new Date().toISOString(),
    type: row.type,
    title: row.title,
    description: row.description,
    affectedResourceId: row.affected_resource_id || undefined,
    affectedResourceName: row.affected_resource_name || undefined,
    affectedRequestIds: Array.isArray(row.affected_request_ids) ? row.affected_request_ids : [],
    reallocations: Array.isArray(row.reallocations) ? row.reallocations : [],
  };
}

export function mapDisruptionToDb(d: DisruptionEvent) {
  return {
    id: d.id,
    timestamp: d.timestamp,
    type: d.type,
    title: d.title,
    description: d.description,
    affected_resource_id: d.affectedResourceId || null,
    affected_resource_name: d.affectedResourceName || null,
    affected_request_ids: d.affectedRequestIds,
    reallocations: d.reallocations,
  };
}

// ----------------------------------------------------------------------------
// Supabase Async Persistence & Fetch Operations
// ----------------------------------------------------------------------------

export async function fetchAllSupabaseData() {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const [
      farmersRes,
      ownersRes,
      resourcesRes,
      requestsRes,
      bookingsRes,
      disruptionsRes,
    ] = await Promise.allSettled([
      supabase.from('farmers').select('*'),
      supabase.from('resource_owners').select('*'),
      supabase.from('resources').select('*'),
      supabase.from('resource_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*'),
      supabase.from('disruptions').select('*').order('timestamp', { ascending: false }),
    ]);

    const result: {
      farmers?: FarmerProfile[];
      resourceOwners?: ResourceOwnerProfile[];
      resources?: ResourceItem[];
      requests?: ResourceRequest[];
      bookings?: Booking[];
      disruptions?: DisruptionEvent[];
    } = {};

    if (farmersRes.status === 'fulfilled' && !farmersRes.value.error && farmersRes.value.data?.length) {
      result.farmers = farmersRes.value.data.map(mapFarmerFromDb);
    }
    if (ownersRes.status === 'fulfilled' && !ownersRes.value.error && ownersRes.value.data?.length) {
      result.resourceOwners = ownersRes.value.data.map(mapResourceOwnerFromDb);
    }
    if (resourcesRes.status === 'fulfilled' && !resourcesRes.value.error && resourcesRes.value.data?.length) {
      result.resources = resourcesRes.value.data.map(mapResourceFromDb);
    }
    if (requestsRes.status === 'fulfilled' && !requestsRes.value.error && requestsRes.value.data?.length) {
      result.requests = requestsRes.value.data.map(mapRequestFromDb);
    }
    if (bookingsRes.status === 'fulfilled' && !bookingsRes.value.error && bookingsRes.value.data?.length) {
      result.bookings = bookingsRes.value.data.map(mapBookingFromDb);
    }
    if (disruptionsRes.status === 'fulfilled' && !disruptionsRes.value.error && disruptionsRes.value.data?.length) {
      result.disruptions = disruptionsRes.value.data.map(mapDisruptionFromDb);
    }

    return result;
  } catch (err) {
    console.warn('Supabase data query issue, keeping local cache:', err);
    return null;
  }
}

export async function upsertRequestToSupabase(req: ResourceRequest): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload = mapRequestToDb(req);
    const { error } = await supabase.from('resource_requests').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsert request note:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase request network error:', e);
    return false;
  }
}

export async function upsertBookingToSupabase(booking: Booking): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload = mapBookingToDb(booking);
    const { error } = await supabase.from('bookings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsert booking note:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase booking network error:', e);
    return false;
  }
}

export async function updateResourceStatusInSupabase(
  resourceId: string,
  status: string,
  maintenanceReason?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('resources')
      .update({
        status,
        maintenance_reason: maintenanceReason || null,
      })
      .eq('id', resourceId);

    if (error) {
      console.warn('Supabase update resource status note:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase resource update error:', e);
    return false;
  }
}

export async function insertResourceToSupabase(res: ResourceItem): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload = mapResourceToDb(res);
    const { error } = await supabase.from('resources').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase insert resource note:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase insert resource error:', e);
    return false;
  }
}

export async function insertDisruptionToSupabase(d: DisruptionEvent): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const payload = mapDisruptionToDb(d);
    const { error } = await supabase.from('disruptions').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase disruption note:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase disruption network error:', e);
    return false;
  }
}

export async function seedInitialDataToSupabase(
  farmers: FarmerProfile[],
  owners: ResourceOwnerProfile[],
  resources: ResourceItem[],
  requests: ResourceRequest[],
  bookings: Booking[]
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    await Promise.allSettled([
      supabase.from('farmers').upsert(farmers.map(mapFarmerToDb), { onConflict: 'id' }),
      supabase.from('resource_owners').upsert(owners.map(mapResourceOwnerToDb), { onConflict: 'id' }),
      supabase.from('resources').upsert(resources.map(mapResourceToDb), { onConflict: 'id' }),
      supabase.from('resource_requests').upsert(requests.map(mapRequestToDb), { onConflict: 'id' }),
      supabase.from('bookings').upsert(bookings.map(mapBookingToDb), { onConflict: 'id' }),
    ]);
    return true;
  } catch (e) {
    console.warn('Supabase seed error:', e);
    return false;
  }
}
