import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  FarmerProfile,
  ResourceOwnerProfile,
  ResourceItem,
  ResourceRequest,
  Booking,
  DisruptionEvent,
  CropStage,
  UrgencyLevel,
  WeatherRiskLevel,
  ResourceCategory,
  ResourceStatus,
} from '../types';
import {
  SEED_FARMERS,
  SEED_OWNERS,
  SEED_RESOURCES,
  INITIAL_REQUESTS,
  INITIAL_BOOKINGS,
  INITIAL_DISRUPTIONS,
} from '../data/seedData';
import {
  calculatePriorityScore,
  calculateDistanceKm,
  calculateTransitMinutes,
} from '../utils/priorityEngine';
import {
  findFeasibleSlotForRequest,
  timeStrToDecimal,
  decimalToTimeStr,
} from '../utils/scheduler';
import {
  loadLocalData,
  saveLocalData,
  LOCAL_STORAGE_KEY,
  OFFLINE_QUEUE_KEY,
  getSupabase,
  isSupabaseConfigured,
  fetchAllSupabaseData,
  upsertRequestToSupabase,
  upsertBookingToSupabase,
  updateResourceStatusInSupabase,
  insertResourceToSupabase,
  insertDisruptionToSupabase,
  seedInitialDataToSupabase,
  mapRequestFromDb,
  mapResourceFromDb,
  mapBookingFromDb,
} from '../db/supabaseClient';

interface SubmitRequestParams {
  farmerId: string;
  resourceCategory: ResourceCategory;
  resourceType: string;
  date: string;
  earliestStart: string;
  latestEnd: string;
  durationHours: number;
  cropStage: CropStage;
  urgency: UrgencyLevel;
  urgencyJustification: string;
  weatherRisk: WeatherRiskLevel;
  weatherNote?: string;
}

interface FarmGridContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedFarmerId: string;
  setSelectedFarmerId: (id: string) => void;
  selectedOwnerId: string;
  setSelectedOwnerId: (id: string) => void;

  farmers: FarmerProfile[];
  resourceOwners: ResourceOwnerProfile[];
  resources: ResourceItem[];
  requests: ResourceRequest[];
  bookings: Booking[];
  disruptions: DisruptionEvent[];

  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  offlineQueue: ResourceRequest[];
  syncStatus: 'idle' | 'syncing' | 'synced';
  lastSyncMessage: string | null;

  activeDisruption: DisruptionEvent | null;
  isSupabaseConnected: boolean;

  // Actions
  submitRequest: (params: SubmitRequestParams) => ResourceRequest;
  syncOfflineQueue: () => void;
  resolveConflict: (
    requestId: string,
    action: 'accept_alt_slot' | 'assign_alt_resource' | 'manual_override',
    altResourceId?: string
  ) => void;
  triggerDisruption: (type: 'machine_breakdown' | 'heavy_rain' | 'cancellation') => void;
  resetDisruptions: () => void;
  resetAllDemoData: () => void;
  updateResourceStatus: (
    resourceId: string,
    status: ResourceStatus,
    maintenanceReason?: string
  ) => void;
  addResource: (res: Omit<ResourceItem, 'id'>) => void;
  updateFarmerProfile: (farmer: FarmerProfile) => void;
}

const FarmGridContext = createContext<FarmGridContextType | undefined>(undefined);

export const FarmGridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('farmer-1');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('owner-1');

  // Persistence
  const [farmers, setFarmers] = useState<FarmerProfile[]>(() =>
    loadLocalData('farmgrid_farmers', SEED_FARMERS)
  );
  const [resourceOwners, setResourceOwners] = useState<ResourceOwnerProfile[]>(() =>
    loadLocalData('farmgrid_owners', SEED_OWNERS)
  );
  const [resources, setResources] = useState<ResourceItem[]>(() =>
    loadLocalData('farmgrid_resources', SEED_RESOURCES)
  );
  const [requests, setRequests] = useState<ResourceRequest[]>(() =>
    loadLocalData('farmgrid_requests', INITIAL_REQUESTS)
  );
  const [bookings, setBookings] = useState<Booking[]>(() =>
    loadLocalData('farmgrid_bookings', INITIAL_BOOKINGS)
  );
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>(() =>
    loadLocalData('farmgrid_disruptions', INITIAL_DISRUPTIONS)
  );

  // Offline simulation state
  const [isOffline, setIsOfflineState] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<ResourceRequest[]>(() =>
    loadLocalData(OFFLINE_QUEUE_KEY, [])
  );
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null);
  const [activeDisruption, setActiveDisruption] = useState<DisruptionEvent | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());

  // Initial Supabase database fetch & realtime sync
  useEffect(() => {
    let isMounted = true;

    if (isSupabaseConfigured()) {
      setIsSupabaseConnected(true);
      fetchAllSupabaseData()
        .then((data) => {
          if (!isMounted || !data) return;
          if (data.farmers && data.farmers.length > 0) setFarmers(data.farmers);
          if (data.resourceOwners && data.resourceOwners.length > 0) setResourceOwners(data.resourceOwners);
          if (data.resources && data.resources.length > 0) setResources(data.resources);
          if (data.requests && data.requests.length > 0) setRequests(data.requests);
          if (data.bookings && data.bookings.length > 0) setBookings(data.bookings);
          if (data.disruptions && data.disruptions.length > 0) setDisruptions(data.disruptions);

          // Seed default demo data if Supabase tables are freshly provisioned and empty
          if (!data.farmers || data.farmers.length === 0) {
            seedInitialDataToSupabase(
              SEED_FARMERS,
              SEED_OWNERS,
              SEED_RESOURCES,
              INITIAL_REQUESTS,
              INITIAL_BOOKINGS
            );
          }
        })
        .catch((err) => {
          console.warn('Initial Supabase fetch completed with note:', err);
        });

      // Realtime subscription across requests, resources, and bookings
      const supabase = getSupabase();
      if (supabase) {
        const channel = supabase
          .channel('farmgrid_live_channel')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'resource_requests' },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT') {
                const newReq = mapRequestFromDb(payload.new);
                setRequests((prev) => (prev.some((r) => r.id === newReq.id) ? prev : [newReq, ...prev]));
              } else if (payload.eventType === 'UPDATE') {
                const updReq = mapRequestFromDb(payload.new);
                setRequests((prev) => prev.map((r) => (r.id === updReq.id ? updReq : r)));
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'resources' },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                const updRes = mapResourceFromDb(payload.new);
                setResources((prev) => {
                  const idx = prev.findIndex((r) => r.id === updRes.id);
                  if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = updRes;
                    return copy;
                  }
                  return [...prev, updRes];
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'bookings' },
            (payload) => {
              if (!isMounted) return;
              if (payload.eventType === 'INSERT') {
                const newB = mapBookingFromDb(payload.new);
                setBookings((prev) => (prev.some((b) => b.id === newB.id) ? prev : [...prev, newB]));
              } else if (payload.eventType === 'UPDATE') {
                const updB = mapBookingFromDb(payload.new);
                setBookings((prev) => prev.map((b) => (b.id === updB.id ? updB : b)));
              }
            }
          )
          .subscribe();

        return () => {
          isMounted = false;
          supabase.removeChannel(channel);
        };
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes
  useEffect(() => {
    saveLocalData('farmgrid_farmers', farmers);
    saveLocalData('farmgrid_owners', resourceOwners);
    saveLocalData('farmgrid_resources', resources);
    saveLocalData('farmgrid_requests', requests);
    saveLocalData('farmgrid_bookings', bookings);
    saveLocalData('farmgrid_disruptions', disruptions);
    saveLocalData(OFFLINE_QUEUE_KEY, offlineQueue);
  }, [farmers, resourceOwners, resources, requests, bookings, disruptions, offlineQueue]);

  // Real browser online/offline event listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineState(false);
      triggerAutoSync();
    };
    const handleOffline = () => {
      setIsOfflineState(true);
      setLastSyncMessage('📴 Offline: Network disconnected. Requests will be stored locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setIsOffline = (offline: boolean) => {
    setIsOfflineState(offline);
    if (!offline) {
      triggerAutoSync();
    } else {
      setLastSyncMessage('📴 Offline: Offline Mode simulated. Requests will queue in local cache.');
    }
  };

  const triggerAutoSync = () => {
    const queue = loadLocalData<ResourceRequest[]>(OFFLINE_QUEUE_KEY, []);
    if (queue.length > 0) {
      setSyncStatus('syncing');
      setTimeout(() => {
        setRequests((prev) => {
          const updated = [...prev];
          queue.forEach((item) => {
            const syncedItem: ResourceRequest = { ...item, syncStatus: 'synced' };
            const idx = updated.findIndex((r) => r.id === item.id);
            if (idx >= 0) {
              updated[idx] = syncedItem;
            } else {
              updated.push(syncedItem);
            }
            if (isSupabaseConfigured()) {
              upsertRequestToSupabase(syncedItem);
            }
          });
          return updated;
        });
        setOfflineQueue([]);
        saveLocalData(OFFLINE_QUEUE_KEY, []);
        setSyncStatus('synced');
        setLastSyncMessage(
          `🟢 Online: ${queue.length} pending request(s) synchronized successfully.`
        );
        setTimeout(() => setSyncStatus('idle'), 5000);
      }, 700);
    } else {
      setLastSyncMessage('🟢 Online: Central scheduler synchronized.');
      setTimeout(() => setLastSyncMessage(null), 4000);
    }
  };

  const syncOfflineQueue = () => {
    triggerAutoSync();
  };

  /**
   * Submit farmer resource request
   */
  const submitRequest = (params: SubmitRequestParams): ResourceRequest => {
    const farmer = farmers.find((f) => f.id === params.farmerId) || farmers[0];
    const newId = `req-${Date.now().toString().slice(-4)}`;

    // Estimate initial distance to nearest depot for priority scoring
    const candidateResource = resources.find(
      (r) =>
        r.category === params.resourceCategory &&
        r.subType.toLowerCase() === params.resourceType.toLowerCase()
    );
    const distKm = candidateResource
      ? calculateDistanceKm(farmer.location, candidateResource.location)
      : 3.0;

    // Calculate deterministic priority score 0-100
    const priorityScore = calculatePriorityScore({
      urgency: params.urgency,
      weatherRisk: params.weatherRisk,
      cropStage: params.cropStage,
      queueMinutesElapsed: 15,
      distanceKm: distKm,
      farmLocation: farmer.location,
      resourceCategory: params.resourceCategory,
      resourceType: params.resourceType,
    });

    let decisionExplanation = '';
    let status: ResourceRequest['status'] = 'pending';
    let assignedResourceId: string | undefined;
    let assignedResourceName: string | undefined;
    let allocatedSlot: ResourceRequest['allocatedSlot'];
    let conflictDetails: ResourceRequest['conflictDetails'];

    if (!isOffline) {
      // Evaluate feasibility and conflicts using the scheduling engine
      const tempReq: ResourceRequest = {
        id: newId,
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmLocation: farmer.location,
        resourceCategory: params.resourceCategory,
        resourceType: params.resourceType,
        date: params.date,
        earliestStart: params.earliestStart,
        latestEnd: params.latestEnd,
        durationHours: params.durationHours,
        cropStage: params.cropStage,
        urgency: params.urgency,
        urgencyJustification: params.urgencyJustification,
        weatherRisk: params.weatherRisk,
        weatherNote: params.weatherNote,
        createdAt: new Date().toISOString(),
        queueMinutesElapsed: 15,
        priorityScore,
        status: 'pending',
        decisionExplanation: '',
        syncStatus: 'synced',
      };

      const feasibility = findFeasibleSlotForRequest(tempReq, resources, bookings);

      if (feasibility.feasible && feasibility.assignedResource && feasibility.allocatedSlot) {
        status = 'allocated';
        assignedResourceId = feasibility.assignedResource.id;
        assignedResourceName = feasibility.assignedResource.name;
        allocatedSlot = feasibility.allocatedSlot;
        decisionExplanation = `Allocated ${feasibility.assignedResource.name} from ${allocatedSlot.startTime} to ${allocatedSlot.endTime} (Priority: ${priorityScore.totalScore}/100). Includes ${allocatedSlot.transitMinutes}m transit from depot.`;

        // Create booking
        const newBooking: Booking = {
          id: `book-${Date.now().toString().slice(-4)}`,
          requestId: newId,
          resourceId: feasibility.assignedResource.id,
          resourceName: feasibility.assignedResource.name,
          farmerId: farmer.id,
          farmerName: farmer.name,
          farmLocation: farmer.location,
          date: params.date,
          startTime: allocatedSlot.startTime,
          endTime: allocatedSlot.endTime,
          transitStartTime: allocatedSlot.transitStartTime,
          transitMinutes: allocatedSlot.transitMinutes,
          bufferMinutes: allocatedSlot.bufferMinutes,
          status: 'confirmed',
          cropStage: params.cropStage,
          priorityScore: priorityScore.totalScore,
        };

        setBookings((prev) => [...prev, newBooking]);
        if (!isOffline && isSupabaseConfigured()) {
          upsertBookingToSupabase(newBooking);
        }
      } else {
        // Conflict or capacity constraint
        status = 'conflict';
        decisionExplanation =
          feasibility.reason ||
          `Resource conflict: Time window requested overlaps with competing allocations. Priority Score: ${priorityScore.totalScore}/100.`;

        const altSlot = feasibility.alternativeSlots?.[0];
        const altRes = feasibility.alternativeResources?.[0];

        conflictDetails = {
          conflictingWithRequestId: 'req-active',
          conflictingFarmerName: 'Competing Regional Request',
          resourceName: candidateResource?.name || params.resourceType,
          overlappingTime: `${params.earliestStart} – ${params.latestEnd}`,
          alternativeSlotSuggested: altSlot
            ? `${altSlot.start} – ${altSlot.end} on ${altSlot.resourceName}`
            : 'Next shift (14:00 onwards)',
          alternativeResourceSuggested: altRes
            ? `${altRes.resource.name} (${altRes.distanceKm.toFixed(1)} km away)`
            : undefined,
        };
      }
    } else {
      // Offline submission
      decisionExplanation =
        'Request saved locally in offline queue. Priority calculated deterministically; allocation will be completed when connectivity returns.';
      status = 'pending';
    }

    const newRequest: ResourceRequest = {
      id: newId,
      farmerId: farmer.id,
      farmerName: farmer.name,
      farmLocation: farmer.location,
      resourceCategory: params.resourceCategory,
      resourceType: params.resourceType,
      date: params.date,
      earliestStart: params.earliestStart,
      latestEnd: params.latestEnd,
      durationHours: params.durationHours,
      cropStage: params.cropStage,
      urgency: params.urgency,
      urgencyJustification: params.urgencyJustification,
      weatherRisk: params.weatherRisk,
      weatherNote: params.weatherNote,
      createdAt: new Date().toISOString(),
      queueMinutesElapsed: 15,
      priorityScore,
      status,
      assignedResourceId,
      assignedResourceName,
      allocatedSlot,
      decisionExplanation,
      syncStatus: isOffline ? 'pending_sync' : 'synced',
      conflictDetails,
    };

    if (isOffline) {
      setOfflineQueue((prev) => [...prev, newRequest]);
      setLastSyncMessage('📴 Offline: Request saved locally in synchronization queue.');
    } else if (isSupabaseConfigured()) {
      upsertRequestToSupabase(newRequest);
    }

    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  };

  /**
   * Conflict resolution: Farmer or Admin accepts suggested alternative slot or assigns alternative resource
   */
  const resolveConflict = (
    requestId: string,
    action: 'accept_alt_slot' | 'assign_alt_resource' | 'manual_override',
    altResourceId?: string
  ) => {
    setRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        let resourceToAssign = resources.find((r) => r.id === req.assignedResourceId);
        let startTime = '11:00';
        let endTime = '13:00';

        if (action === 'assign_alt_resource' || altResourceId) {
          const found = resources.find((r) => r.id === altResourceId || (r.subType === req.resourceType && r.status === 'available'));
          if (found) {
            resourceToAssign = found;
            startTime = req.earliestStart;
            const startDec = timeStrToDecimal(startTime);
            endTime = decimalToTimeStr(startDec + req.durationHours);
          }
        } else if (action === 'accept_alt_slot') {
          // Suggested slot
          startTime = '11:00';
          endTime = '13:00';
        }

        const transitMins = 30;
        const transitStartDec = Math.max(7, timeStrToDecimal(startTime) - transitMins / 60);

        const slot: ResourceRequest['allocatedSlot'] = {
          resourceId: resourceToAssign?.id || 'res-alt',
          resourceName: resourceToAssign?.name || req.resourceType,
          date: req.date,
          startTime,
          endTime,
          transitStartTime: decimalToTimeStr(transitStartDec),
          transitEndTime: startTime,
          transitMinutes: transitMins,
          bufferMinutes: 15,
        };

        const resolvedBooking: Booking = {
          id: `book-res-${req.id}`,
          requestId: req.id,
          resourceId: slot.resourceId,
          resourceName: slot.resourceName,
          farmerId: req.farmerId,
          farmerName: req.farmerName,
          farmLocation: req.farmLocation,
          date: req.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          transitStartTime: slot.transitStartTime,
          transitMinutes: slot.transitMinutes,
          bufferMinutes: slot.bufferMinutes,
          status: 'confirmed',
          cropStage: req.cropStage,
          priorityScore: req.priorityScore.totalScore,
        };

        // Create or update booking
        setBookings((bPrev) => {
          const filtered = bPrev.filter((b) => b.requestId !== req.id);
          return [...filtered, resolvedBooking];
        });

        const updatedRequest: ResourceRequest = {
          ...req,
          status: 'allocated',
          assignedResourceId: slot.resourceId,
          assignedResourceName: slot.resourceName,
          allocatedSlot: slot,
          conflictDetails: undefined,
          decisionExplanation: `Conflict resolved via ${action === 'assign_alt_resource' ? 'alternative available machine assignment' : 'feasible subsequent time window'}. Assigned to ${slot.resourceName} (${slot.startTime}–${slot.endTime}).`,
        };

        if (!isOffline && isSupabaseConfigured()) {
          upsertBookingToSupabase(resolvedBooking);
          upsertRequestToSupabase(updatedRequest);
        }

        return updatedRequest;
      })
    );
  };

  /**
   * Dynamic Disruption Handling:
   * 1. Identify affected resources/bookings
   * 2. Identify affected farmers
   * 3. Recalculate priority scores where required
   * 4. Find alternative available resources or feasible time slots
   * 5. Generate a revised schedule
   * 6. Update master dashboard
   * 7. Show side-by-side what changed and why!
   */
  const triggerDisruption = (type: 'machine_breakdown' | 'heavy_rain' | 'cancellation') => {
    if (type === 'machine_breakdown') {
      // Tractor 01 suffers sudden breakdown
      const targetRes = resources.find((r) => r.id === 'res-tractor-1') || resources[0];
      const altRes = resources.find((r) => r.id === 'res-tractor-2') || resources[1];

      // Mark target resource as disrupted
      setResources((prev) =>
        prev.map((r) =>
          r.id === targetRes.id
            ? { ...r, status: 'disrupted', maintenanceReason: 'Hydraulic transmission failure (in-field breakdown)' }
            : r.id === altRes.id
            ? { ...r, status: 'booked' }
            : r
        )
      );

      // Find affected bookings on this resource
      const affectedBookings = bookings.filter(
        (b) => b.resourceId === targetRes.id && b.status !== 'completed'
      );
      const affectedReqIds = affectedBookings.map((b) => b.requestId);

      const reallocations: DisruptionEvent['reallocations'] = [];

      // Reallocate each affected booking to Tractor 02
      setBookings((prev) =>
        prev.map((b) => {
          if (b.resourceId === targetRes.id) {
            const newStart = '11:00';
            const newEnd = '13:00';
            reallocations.push({
              requestId: b.requestId,
              farmerName: b.farmerName,
              before: {
                resourceName: targetRes.name,
                timeWindow: `${b.startTime} – ${b.endTime}`,
              },
              disruptionReason: 'Hydraulic transmission failure on Tractor 01',
              after: {
                resourceName: altRes.name,
                timeWindow: `${newStart} – ${newEnd}`,
                status: 'Reallocated & Confirmed',
              },
              explanation: `Shifted to available unit ${altRes.name}. High priority score retained due to urgent harvest deadline.`,
            });

            return {
              ...b,
              resourceId: altRes.id,
              resourceName: altRes.name,
              startTime: newStart,
              endTime: newEnd,
              transitStartTime: '10:30',
              status: 'reallocated',
            };
          }
          return b;
        })
      );

      // Update requests
      setRequests((prev) =>
        prev.map((req) => {
          if (req.assignedResourceId === targetRes.id) {
            return {
              ...req,
              status: 'allocated',
              assignedResourceId: altRes.id,
              assignedResourceName: altRes.name,
              allocatedSlot: req.allocatedSlot
                ? {
                    ...req.allocatedSlot,
                    resourceId: altRes.id,
                    resourceName: altRes.name,
                    startTime: '11:00',
                    endTime: '13:00',
                    transitStartTime: '10:30',
                  }
                : undefined,
              decisionExplanation: `Disruption Handled: Reallocated to ${altRes.name} following breakdown of ${targetRes.name}. Allocated slot: 11:00–13:00.`,
            };
          }
          return req;
        })
      );

      const disruptionEvent: DisruptionEvent = {
        id: `disr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'machine_breakdown',
        title: 'Mechanical Breakdown on Mahindra 575 DI (Tractor 01)',
        description:
          'Hydraulic pump failure halted operations during early morning shift. Master scheduler automatically triggered reserve reallocation to Swaraj 855 FE (Tractor 02).',
        affectedResourceId: targetRes.id,
        affectedResourceName: targetRes.name,
        affectedRequestIds: affectedReqIds,
        reallocations,
      };

      setDisruptions((prev) => [disruptionEvent, ...prev]);
      setActiveDisruption(disruptionEvent);
      if (isSupabaseConfigured()) {
        insertDisruptionToSupabase(disruptionEvent);
      }
    } else if (type === 'heavy_rain') {
      // Heavy rain: elevate weather risks, postpone outdoor spraying, prioritize urgent drainage pumps
      const reallocations: DisruptionEvent['reallocations'] = [];

      setRequests((prev) =>
        prev.map((req) => {
          if (req.resourceCategory === 'Specialized Services' && req.resourceType.includes('Drone')) {
            reallocations.push({
              requestId: req.id,
              farmerName: req.farmerName,
              before: {
                resourceName: req.assignedResourceName || 'Drone Sprayer',
                timeWindow: '07:30 – 09:00',
              },
              disruptionReason: 'Heavy torrential rain & high wind speeds (>35 km/h) unsafe for drone flight',
              after: {
                resourceName: req.assignedResourceName || 'Drone Sprayer',
                timeWindow: 'Postponed to post-rain dry window (Next Day 07:00)',
                status: 'Rescheduled (Safety Hold)',
              },
              explanation:
                'Chemical atomization prohibited under active precipitation due to wash-off hazard.',
            });

            return {
              ...req,
              weatherRisk: 'severe',
              status: 'disrupted',
              decisionExplanation:
                'Flight halted due to IMD heavy rain & wind alert. Flight safety protocol automatically rescheduled operation to dry window.',
            };
          }
          return req;
        })
      );

      const disruptionEvent: DisruptionEvent = {
        id: `disr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'heavy_rain',
        title: 'Severe Rainfall & Flash Flood Alert Triggered',
        description:
          'Meteorological alert active for Ratnagiri and Kalyanpur agricultural clusters. Outdoor precision drone spraying halted; irrigation booster requests de-prioritized in favor of drainage equipment.',
        affectedRequestIds: ['req-105'],
        reallocations,
      };

      setDisruptions((prev) => [disruptionEvent, ...prev]);
      setActiveDisruption(disruptionEvent);
      if (isSupabaseConfigured()) {
        insertDisruptionToSupabase(disruptionEvent);
      }
    } else if (type === 'cancellation') {
      // Cancellation simulation: Sunita Devi releases harvester early, Baldev Singh gets pulled from queue
      const reallocations: DisruptionEvent['reallocations'] = [
        {
          requestId: 'req-103',
          farmerName: 'Sunita Devi',
          before: {
            resourceName: 'Claas Crop Tiger 30 (Harvester 01)',
            timeWindow: '10:30 – 13:00',
          },
          disruptionReason: 'Farmer completed field threshing early and released resource',
          after: {
            resourceName: 'Claas Crop Tiger 30 (Harvester 01)',
            timeWindow: 'Slot Liberated at 11:30 AM',
            status: 'Completed / Early Release',
          },
          explanation: 'Released 1.5 hours of combine harvester capacity back into the common pool.',
        },
        {
          requestId: 'req-104',
          farmerName: 'Baldev Singh',
          before: {
            resourceName: 'Pending in Queue',
            timeWindow: 'Unassigned',
          },
          disruptionReason: 'Capacity liberated by upstream early release',
          after: {
            resourceName: 'Claas Harvester 01 / Kirloskar Pump 01',
            timeWindow: '12:00 – 14:00',
            status: 'Promoted to Immediate Allocation',
          },
          explanation:
            'Dynamic queue advancement: System automatically filled vacant time slot with next highest priority contender.',
        },
      ];

      setRequests((prev) =>
        prev.map((req) => {
          if (req.id === 'req-104') {
            return {
              ...req,
              status: 'allocated',
              assignedResourceId: 'res-pump-1',
              assignedResourceName: 'Kirloskar 5HP Portable Solar Pump',
              allocatedSlot: {
                resourceId: 'res-pump-1',
                resourceName: 'Kirloskar 5HP Portable Solar Pump',
                date: '2026-09-11',
                startTime: '12:00',
                endTime: '15:00',
                transitStartTime: '11:30',
                transitEndTime: '12:00',
                transitMinutes: 30,
                bufferMinutes: 15,
              },
              decisionExplanation:
                'Early cancellation by upstream farmer freed up regional transit buffer; Baldev Singh promoted from queue to active allocation.',
            };
          }
          return req;
        })
      );

      const disruptionEvent: DisruptionEvent = {
        id: `disr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'cancellation',
        title: 'Early Slot Release & Instant Queue Reallocation',
        description:
          'Farmer Sunita Devi finished operations ahead of schedule. Feasible scheduler dynamically matched and promoted pending request req-104.',
        affectedRequestIds: ['req-103', 'req-104'],
        reallocations,
      };

      setDisruptions((prev) => [disruptionEvent, ...prev]);
      setActiveDisruption(disruptionEvent);
      if (isSupabaseConfigured()) {
        insertDisruptionToSupabase(disruptionEvent);
      }
    }
  };

  const resetDisruptions = () => {
    setActiveDisruption(null);
    setResources(SEED_RESOURCES);
    setRequests(INITIAL_REQUESTS);
    setBookings(INITIAL_BOOKINGS);
    setDisruptions([]);
  };

  const resetAllDemoData = () => {
    setFarmers(SEED_FARMERS);
    setResourceOwners(SEED_OWNERS);
    setResources(SEED_RESOURCES);
    setRequests(INITIAL_REQUESTS);
    setBookings(INITIAL_BOOKINGS);
    setDisruptions([]);
    setOfflineQueue([]);
    setIsOfflineState(false);
    setActiveDisruption(null);
    setLastSyncMessage('Demo data restored to initial baseline.');
    if (isSupabaseConfigured()) {
      seedInitialDataToSupabase(
        SEED_FARMERS,
        SEED_OWNERS,
        SEED_RESOURCES,
        INITIAL_REQUESTS,
        INITIAL_BOOKINGS
      );
    }
  };

  const updateResourceStatus = (
    resourceId: string,
    status: ResourceStatus,
    maintenanceReason?: string
  ) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resourceId ? { ...r, status, maintenanceReason } : r))
    );
    if (!isOffline && isSupabaseConfigured()) {
      updateResourceStatusInSupabase(resourceId, status, maintenanceReason);
    }
  };

  const addResource = (res: Omit<ResourceItem, 'id'>) => {
    const newRes: ResourceItem = {
      ...res,
      id: `res-${Date.now().toString().slice(-4)}`,
    };
    setResources((prev) => [...prev, newRes]);
    if (!isOffline && isSupabaseConfigured()) {
      insertResourceToSupabase(newRes);
    }
  };

  const updateFarmerProfile = (farmer: FarmerProfile) => {
    setFarmers((prev) => prev.map((f) => (f.id === farmer.id ? farmer : f)));
  };

  return (
    <FarmGridContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        selectedFarmerId,
        setSelectedFarmerId,
        selectedOwnerId,
        setSelectedOwnerId,
        farmers,
        resourceOwners,
        resources,
        requests,
        bookings,
        disruptions,
        isOffline,
        setIsOffline,
        offlineQueue,
        syncStatus,
        lastSyncMessage,
        activeDisruption,
        isSupabaseConnected,
        submitRequest,
        syncOfflineQueue,
        resolveConflict,
        triggerDisruption,
        resetDisruptions,
        resetAllDemoData,
        updateResourceStatus,
        addResource,
        updateFarmerProfile,
      }}
    >
      {children}
    </FarmGridContext.Provider>
  );
};

export const useFarmGrid = () => {
  const context = useContext(FarmGridContext);
  if (!context) {
    throw new Error('useFarmGrid must be used within a FarmGridProvider');
  }
  return context;
};
