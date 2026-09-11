import {
  ResourceItem,
  ResourceRequest,
  Booking,
  AllocatedSlot,
} from '../types';
import { calculateDistanceKm, calculateTransitMinutes } from './priorityEngine';

export interface TimeSlot {
  startHour: number; // e.g. 8.5 for 08:30
  endHour: number; // e.g. 10.5 for 10:30
  startTimeStr: string; // "08:30"
  endTimeStr: string; // "10:30"
  transitMinutes: number;
  bufferMinutes: number;
}

// Convert "08:30" to 8.5
export function timeStrToDecimal(timeStr: string): number {
  if (!timeStr) return 8;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  return h + m / 60;
}

// Convert 8.5 to "08:30"
export function decimalToTimeStr(dec: number): string {
  const totalMins = Math.round(dec * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const hh = h < 10 ? `0${h}` : `${h}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return `${hh}:${mm}`;
}

export function formatTimeSlot(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * Checks if two time windows overlap
 */
export function doTimesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return Math.max(startA, startB) < Math.min(endA, endB);
}

export interface FeasibilityResult {
  feasible: boolean;
  assignedResource?: ResourceItem;
  allocatedSlot?: AllocatedSlot;
  conflictingRequestId?: string;
  conflictingBooking?: Booking;
  alternativeSlots?: {
    resourceId: string;
    resourceName: string;
    start: string;
    end: string;
    transitMinutes: number;
  }[];
  alternativeResources?: {
    resource: ResourceItem;
    availableFrom: string;
    distanceKm: number;
  }[];
  reason?: string;
}

/**
 * Finds feasible time slots for a request on available matching resources
 * taking into account:
 * - Farmer's earliest start & latest end
 * - Duration
 * - Resource operating window
 * - Existing bookings + transit & buffer times
 */
export function findFeasibleSlotForRequest(
  request: ResourceRequest,
  resources: ResourceItem[],
  existingBookings: Booking[]
): FeasibilityResult {
  const reqStart = timeStrToDecimal(request.earliestStart);
  const reqEnd = timeStrToDecimal(request.latestEnd);
  const duration = request.durationHours;

  // Filter resources of matching category and subType
  const matchingResources = resources.filter(
    (r) =>
      r.category === request.resourceCategory &&
      (r.subType.toLowerCase() === request.resourceType.toLowerCase() ||
        r.name.toLowerCase().includes(request.resourceType.toLowerCase())) &&
      r.status !== 'maintenance' &&
      r.status !== 'disrupted'
  );

  if (matchingResources.length === 0) {
    return {
      feasible: false,
      reason: `No operational ${request.resourceType} currently available (units are under maintenance or disrupted).`,
    };
  }

  // Evaluate each matching resource
  for (const resource of matchingResources) {
    // Check distance & transit buffer
    const distKm = calculateDistanceKm(request.farmLocation, resource.location);
    const transitMins = calculateTransitMinutes(distKm);
    const transitHours = transitMins / 60;
    const bufferHours = 15 / 60; // 15 mins maintenance/coupling buffer

    // Existing bookings for this resource on the request date
    const resourceBookings = existingBookings.filter(
      (b) => b.resourceId === resource.id && b.date === request.date && b.status !== 'disrupted'
    );

    // Sort bookings by start time
    resourceBookings.sort((a, b) => timeStrToDecimal(a.startTime) - timeStrToDecimal(b.startTime));

    // Try starting from request's earliest start + transit
    const windowStart = Math.max(resource.operatingWindow.startHour, reqStart);
    const windowEnd = Math.min(resource.operatingWindow.endHour, reqEnd);

    let candidateStart = windowStart;

    // Check if candidate slot is feasible
    let foundSlot = false;
    let finalStart = 0;
    let finalEnd = 0;

    // Test time increments of 15 mins (0.25h)
    while (candidateStart + duration <= windowEnd) {
      const candidateEnd = candidateStart + duration;

      // Check collision with any existing booking including their transit and buffer
      let collision = false;
      for (const b of resourceBookings) {
        const bStart = timeStrToDecimal(b.startTime) - (b.transitMinutes || 30) / 60;
        const bEnd = timeStrToDecimal(b.endTime) + (b.bufferMinutes || 15) / 60;

        // Our candidate needs transit before and buffer after
        const testStart = candidateStart - transitHours;
        const testEnd = candidateEnd + bufferHours;

        if (doTimesOverlap(testStart, testEnd, bStart, bEnd)) {
          collision = true;
          // Jump candidateStart to after this booking's buffer
          candidateStart = bEnd + transitHours;
          break;
        }
      }

      if (!collision) {
        foundSlot = true;
        finalStart = candidateStart;
        finalEnd = candidateEnd;
        break;
      }
    }

    if (foundSlot) {
      const startTimeStr = decimalToTimeStr(finalStart);
      const endTimeStr = decimalToTimeStr(finalEnd);
      const transitStartStr = decimalToTimeStr(finalStart - transitHours);

      return {
        feasible: true,
        assignedResource: resource,
        allocatedSlot: {
          resourceId: resource.id,
          resourceName: resource.name,
          date: request.date,
          startTime: startTimeStr,
          endTime: endTimeStr,
          transitStartTime: transitStartStr,
          transitEndTime: startTimeStr,
          transitMinutes: transitMins,
          bufferMinutes: 15,
        },
      };
    }
  }

  // If we reach here, direct slot was not found without collision
  // Suggest alternative available resources and alternative feasible times
  const alternativeSlots: {
    resourceId: string;
    resourceName: string;
    start: string;
    end: string;
    transitMinutes: number;
  }[] = [];

  const alternativeResources: {
    resource: ResourceItem;
    availableFrom: string;
    distanceKm: number;
  }[] = [];

  matchingResources.forEach((res) => {
    const distKm = calculateDistanceKm(request.farmLocation, res.location);
    const transitMins = calculateTransitMinutes(distKm);
    const bookings = existingBookings.filter(
      (b) => b.resourceId === res.id && b.status !== 'disrupted'
    );
    if (bookings.length > 0) {
      const latestBooking = [...bookings].sort(
        (a, b) => timeStrToDecimal(b.endTime) - timeStrToDecimal(a.endTime)
      )[0];
      const nextFreeHour = timeStrToDecimal(latestBooking.endTime) + 0.5; // + 30m buffer
      alternativeSlots.push({
        resourceId: res.id,
        resourceName: res.name,
        start: decimalToTimeStr(nextFreeHour),
        end: decimalToTimeStr(nextFreeHour + duration),
        transitMinutes: transitMins,
      });
    } else {
      alternativeResources.push({
        resource: res,
        availableFrom: decimalToTimeStr(res.operatingWindow.startHour),
        distanceKm: distKm,
      });
    }
  });

  return {
    feasible: false,
    reason: `Time slot conflict detected: Requested hours overlap with higher-priority active bookings on ${matchingResources[0]?.name || 'resource'}.`,
    alternativeSlots,
    alternativeResources,
  };
}

/**
 * Detects conflicts among all pending and allocated requests targeting the same physical resource
 */
export function detectAllConflicts(
  requests: ResourceRequest[],
  resources: ResourceItem[]
): {
  conflicts: {
    resourceId: string;
    resourceName: string;
    requestA: ResourceRequest;
    requestB: ResourceRequest;
    winningRequestId: string;
    suggestedAlternativeSlot: string;
    suggestedAlternativeResource: string;
  }[];
} {
  const conflicts: {
    resourceId: string;
    resourceName: string;
    requestA: ResourceRequest;
    requestB: ResourceRequest;
    winningRequestId: string;
    suggestedAlternativeSlot: string;
    suggestedAlternativeResource: string;
  }[] = [];

  // Group active requests by assigned resource or requested resource type
  const targetMap = new Map<string, ResourceRequest[]>();

  for (const req of requests) {
    if (req.status === 'cancelled' || req.status === 'completed') continue;
    const key = req.assignedResourceId || `type-${req.resourceType}`;
    if (!targetMap.has(key)) {
      targetMap.set(key, []);
    }
    targetMap.get(key)!.push(req);
  }

  targetMap.forEach((reqList, key) => {
    if (reqList.length < 2) return;

    for (let i = 0; i < reqList.length; i++) {
      for (let j = i + 1; j < reqList.length; j++) {
        const a = reqList[i];
        const b = reqList[j];

        // Check if timing overlaps
        const aStart = a.allocatedSlot
          ? timeStrToDecimal(a.allocatedSlot.startTime)
          : timeStrToDecimal(a.earliestStart);
        const aEnd = a.allocatedSlot
          ? timeStrToDecimal(a.allocatedSlot.endTime)
          : aStart + a.durationHours;

        const bStart = b.allocatedSlot
          ? timeStrToDecimal(b.allocatedSlot.startTime)
          : timeStrToDecimal(b.earliestStart);
        const bEnd = b.allocatedSlot
          ? timeStrToDecimal(b.allocatedSlot.endTime)
          : bStart + b.durationHours;

        // Transit buffer overlap
        if (doTimesOverlap(aStart - 0.25, aEnd + 0.25, bStart - 0.25, bEnd + 0.25)) {
          const res = resources.find((r) => r.id === a.assignedResourceId || r.id === key);
          const resName = res?.name || a.resourceType;

          // Winner has higher deterministic priority score
          const winningReq = a.priorityScore.totalScore >= b.priorityScore.totalScore ? a : b;
          const losingReq = winningReq === a ? b : a;

          // Find alternative resource
          const altResource = resources.find(
            (r) =>
              r.id !== res?.id &&
              r.category === losingReq.resourceCategory &&
              r.subType === losingReq.resourceType &&
              r.status === 'available'
          );

          // Find alternative time slot (after winning finishes + buffer)
          const winEnd = winningReq.allocatedSlot
            ? timeStrToDecimal(winningReq.allocatedSlot.endTime)
            : timeStrToDecimal(winningReq.earliestStart) + winningReq.durationHours;
          const altTimeStart = decimalToTimeStr(winEnd + 0.5);
          const altTimeEnd = decimalToTimeStr(winEnd + 0.5 + losingReq.durationHours);

          conflicts.push({
            resourceId: res?.id || 'res-contested',
            resourceName: resName,
            requestA: a,
            requestB: b,
            winningRequestId: winningReq.id,
            suggestedAlternativeSlot: `${altTimeStart} – ${altTimeEnd} (After ${winningReq.farmerName})`,
            suggestedAlternativeResource: altResource
              ? `${altResource.name} (Currently Available)`
              : 'Next available shift',
          });
        }
      }
    }
  });

  return { conflicts };
}
