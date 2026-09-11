import {
  CropStage,
  UrgencyLevel,
  WeatherRiskLevel,
  PriorityBreakdown,
  LocationCoord,
  ResourceCategory,
} from '../types';

export interface PriorityInput {
  urgency: UrgencyLevel;
  weatherRisk: WeatherRiskLevel;
  cropStage: CropStage;
  queueMinutesElapsed: number; // minutes since request created
  distanceKm?: number; // distance between farm and resource depot
  farmLocation?: LocationCoord;
  resourceCategory?: ResourceCategory;
  resourceType?: string;
}

/**
 * Deterministic Priority Engine that calculates a 0-100 score
 * strictly according to the specified 6 factors:
 * 1. Urgency / Deadline Proximity: 25 pts
 * 2. Weather Risk Exposure: 25 pts
 * 3. Crop Readiness / Biological Stage: 20 pts
 * 4. Queue Waiting Time: 15 pts
 * 5. Distance & Logistics Overhead: 10 pts
 * 6. Resource Constraints: 5 pts
 */
export function calculatePriorityScore(input: PriorityInput): PriorityBreakdown {
  const reasons: string[] = [];

  // Factor 1: Urgency / Deadline Proximity (max 25 pts)
  let urgencyScore = 0;
  switch (input.urgency) {
    case 'critical':
      urgencyScore = 24; // Emergency within <12h
      reasons.push('Harvest/operational deadline is critical (<12 hour window remaining)');
      break;
    case 'high':
      urgencyScore = 19; // 12-24h window
      reasons.push('High deadline proximity: prompt intervention required within 24 hours');
      break;
    case 'moderate':
      urgencyScore = 13; // 24-48h window
      reasons.push('Moderate urgency window (24–48 hours flexibility)');
      break;
    case 'standard':
    default:
      urgencyScore = 7;
      reasons.push('Standard planned schedule (>48 hours planning horizon)');
      break;
  }

  // Factor 2: Weather Risk Exposure (max 25 pts)
  let weatherRiskScore = 0;
  switch (input.weatherRisk) {
    case 'severe':
      weatherRiskScore = 25;
      reasons.push('High weather risk: heavy rain, hail, or storm hazard imminent');
      break;
    case 'moderate':
      weatherRiskScore = 18;
      reasons.push('Moderate weather risk: localized precipitation warning active');
      break;
    case 'low':
      weatherRiskScore = 10;
      reasons.push('Low weather risk: favorable meteorological forecast');
      break;
    case 'none':
    default:
      weatherRiskScore = 4;
      reasons.push('Minimal weather vulnerability: clear atmospheric conditions');
      break;
  }

  // Factor 3: Crop Readiness / Biological Stage (max 20 pts)
  let cropStageScore = 0;
  switch (input.cropStage) {
    case 'immediate_harvest':
      cropStageScore = 20;
      reasons.push('Crop is at immediate harvest: highly perishable biological state');
      break;
    case 'critical_ripening':
      cropStageScore = 16;
      reasons.push('Crop is at critical ripening stage: moisture / lodging sensitivity');
      break;
    case 'flowering':
      cropStageScore = 13;
      reasons.push('Flowering / pollination phase: pesticide/pollination timing sensitive');
      break;
    case 'sowing':
      cropStageScore = 11;
      reasons.push('Sowing / germination window: reliant on optimal soil moisture');
      break;
    case 'vegetative':
    case 'land_prep':
    default:
      cropStageScore = 6;
      reasons.push('Early growth / preparatory stage: resilient to short delays');
      break;
  }

  // Factor 4: Queue Waiting Time (max 15 pts)
  // 0-30m = 3pts, 30m-2h = 7pts, 2h-4h = 10pts, 4h-8h = 13pts, >8h = 15pts
  let queueWaitingScore = 0;
  const waitHours = (input.queueMinutesElapsed || 0) / 60;
  if (waitHours >= 8) {
    queueWaitingScore = 15;
    reasons.push(`Extended wait time: Farmer has been waiting in queue for ${Math.round(waitHours)} hours`);
  } else if (waitHours >= 4) {
    queueWaitingScore = 13;
    reasons.push(`Farmer has been waiting for ${Math.round(waitHours)} hours in the scheduling pool`);
  } else if (waitHours >= 2) {
    queueWaitingScore = 10;
    reasons.push(`Moderate wait: request pending for ${Math.round(waitHours * 10) / 10} hours`);
  } else if (waitHours >= 0.5) {
    queueWaitingScore = 6;
    reasons.push('Recent submission in queue (<2 hours waiting)');
  } else {
    queueWaitingScore = 3;
    reasons.push('Fresh request submission');
  }

  // Factor 5: Distance & Logistics Overhead (max 10 pts)
  // Closer resources = less transit deadheading, higher efficiency score
  let distanceScore = 0;
  const dist = input.distanceKm !== undefined ? input.distanceKm : 3.5;
  if (dist <= 1.5) {
    distanceScore = 10;
    reasons.push(`Resource is highly geographically suitable (${dist.toFixed(1)} km transit distance)`);
  } else if (dist <= 3.5) {
    distanceScore = 8;
    reasons.push(`Optimal cluster proximity: ${dist.toFixed(1)} km from depot`);
  } else if (dist <= 6.0) {
    distanceScore = 6;
    reasons.push(`Moderate logistics distance (${dist.toFixed(1)} km travel buffer needed)`);
  } else if (dist <= 10.0) {
    distanceScore = 4;
    reasons.push(`Longer transit overhead (${dist.toFixed(1)} km)`);
  } else {
    distanceScore = 2;
    reasons.push(`Substantial transit overhead (${dist.toFixed(1)} km)`);
  }

  // Factor 6: Resource Constraints (max 5 pts)
  // Scarcity bonus: high-scarcity equipment like Harvesters and Drones get 5, tractors 4, general labour 3
  let resourceConstraintsScore = 4;
  const subType = (input.resourceType || '').toLowerCase();
  if (subType.includes('harvester') || subType.includes('drone') || subType.includes('cold storage')) {
    resourceConstraintsScore = 5;
    reasons.push('Required resource configuration is in high regional scarcity');
  } else if (subType.includes('tractor') || subType.includes('pump')) {
    resourceConstraintsScore = 4;
    reasons.push('Contested multi-farm physical machinery');
  } else {
    resourceConstraintsScore = 3;
    reasons.push('Standard resource capacity constraint');
  }

  const totalScore = Math.min(
    100,
    urgencyScore +
      weatherRiskScore +
      cropStageScore +
      queueWaitingScore +
      distanceScore +
      resourceConstraintsScore
  );

  return {
    urgencyScore,
    weatherRiskScore,
    cropStageScore,
    queueWaitingScore,
    distanceScore,
    resourceConstraintsScore,
    totalScore,
    reasons,
  };
}

/**
 * Calculates Euclidean distance in km on the synthetic coordinate grid
 */
export function calculateDistanceKm(
  locA: { x: number; y: number },
  locB: { x: number; y: number }
): number {
  const dx = (locA.x - locB.x) * 0.12; // 100 units ~ 12 km grid width
  const dy = (locA.y - locB.y) * 0.12;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0.5, Math.round(dist * 10) / 10);
}

/**
 * Calculates transit time in minutes given distance in km
 * Agricultural tractors/machinery travel at approx 15-20 km/h on rural dirt roads
 */
export function calculateTransitMinutes(distanceKm: number): number {
  // approx 2.5 mins per km + 10 mins setup/coupling buffer
  const mins = Math.round(distanceKm * 3.5 + 10);
  // round to nearest 5 or 10 mins
  return Math.min(60, Math.max(15, Math.ceil(mins / 5) * 5));
}
