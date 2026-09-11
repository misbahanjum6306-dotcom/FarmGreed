export type UserRole = 'farmer' | 'owner' | 'admin';

export type ResourceCategory =
  | 'Agricultural Machinery'
  | 'Irrigation Equipment'
  | 'Storage'
  | 'Transportation'
  | 'Agricultural Labour'
  | 'Specialized Services';

export type CropStage =
  | 'land_prep'
  | 'sowing'
  | 'vegetative'
  | 'flowering'
  | 'critical_ripening'
  | 'immediate_harvest';

export type UrgencyLevel = 'standard' | 'moderate' | 'high' | 'critical';

export type WeatherRiskLevel = 'none' | 'low' | 'moderate' | 'severe';

export type ResourceStatus = 'available' | 'booked' | 'maintenance' | 'disrupted';

export type RequestStatus =
  | 'pending'
  | 'allocated'
  | 'conflict'
  | 'disrupted'
  | 'completed'
  | 'cancelled';

export interface LocationCoord {
  name: string;
  village: string;
  x: number; // 0 - 100 percentage coordinates for grid/map
  y: number;
  lat: number;
  lng: number;
}

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  location: LocationCoord;
  landAreaAcres: number;
  primaryCrop: string;
  activeCropStage: CropStage;
}

export interface ResourceOwnerProfile {
  id: string;
  name: string;
  phone: string;
  village: string;
  organization?: string;
  rating: number;
}

export interface ResourceItem {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  category: ResourceCategory;
  subType: string;
  specifications: string;
  location: LocationCoord;
  operatingWindow: {
    startHour: number; // e.g. 7 for 07:00
    endHour: number; // e.g. 19 for 19:00
  };
  hourlyRateEst?: number;
  status: ResourceStatus;
  maintenanceReason?: string;
}

export interface PriorityBreakdown {
  urgencyScore: number; // max 25
  weatherRiskScore: number; // max 25
  cropStageScore: number; // max 20
  queueWaitingScore: number; // max 15
  distanceScore: number; // max 10
  resourceConstraintsScore: number; // max 5
  totalScore: number; // max 100
  reasons: string[];
}

export interface AllocatedSlot {
  resourceId: string;
  resourceName: string;
  date: string;
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "10:00"
  transitStartTime: string; // e.g. "07:30"
  transitEndTime: string; // e.g. "08:00"
  transitMinutes: number;
  bufferMinutes: number;
}

export interface ResourceRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  farmLocation: LocationCoord;
  resourceCategory: ResourceCategory;
  resourceType: string; // e.g. "Tractor", "Harvester"
  date: string;
  earliestStart: string; // "08:00"
  latestEnd: string; // "14:00"
  durationHours: number; // e.g. 2
  cropStage: CropStage;
  urgency: UrgencyLevel;
  urgencyJustification: string;
  weatherRisk: WeatherRiskLevel;
  weatherNote?: string;
  createdAt: string; // ISO string
  queueMinutesElapsed: number;
  priorityScore: PriorityBreakdown;
  status: RequestStatus;
  assignedResourceId?: string;
  assignedResourceName?: string;
  allocatedSlot?: AllocatedSlot;
  decisionExplanation: string;
  syncStatus: 'synced' | 'pending_sync';
  conflictDetails?: {
    conflictingWithRequestId: string;
    conflictingFarmerName: string;
    resourceName: string;
    overlappingTime: string;
    alternativeSlotSuggested?: string;
    alternativeResourceSuggested?: string;
  };
}

export interface Booking {
  id: string;
  requestId: string;
  resourceId: string;
  resourceName: string;
  farmerId: string;
  farmerName: string;
  farmLocation: LocationCoord;
  date: string;
  startTime: string; // "08:00"
  endTime: string; // "10:00"
  transitStartTime: string;
  transitMinutes: number;
  bufferMinutes: number;
  status: 'confirmed' | 'disrupted' | 'completed' | 'reallocated';
  cropStage: CropStage;
  priorityScore: number;
}

export interface DisruptionEvent {
  id: string;
  timestamp: string;
  type: 'machine_breakdown' | 'heavy_rain' | 'cancellation';
  title: string;
  description: string;
  affectedResourceId?: string;
  affectedResourceName?: string;
  affectedRequestIds: string[];
  reallocations: {
    requestId: string;
    farmerName: string;
    before: {
      resourceName: string;
      timeWindow: string;
    };
    disruptionReason: string;
    after: {
      resourceName: string;
      timeWindow: string;
      status: string;
    };
    explanation: string;
  }[];
}
