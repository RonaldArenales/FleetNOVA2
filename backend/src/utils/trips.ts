import { haversineKm } from "./geo";

export interface TripPoint {
  lat: number;
  lng: number;
  speedKph: number;
  timestamp: Date;
}

export interface Trip {
  startTime: Date;
  endTime: Date;
  distanceKm: number;
  avgSpeedKph: number;
  durationMinutes: number;
}

const GAP_MINUTES = 5; // gap between consecutive readings that splits a trip
const STOP_SPEED_KPH = 1; // "stopped" threshold
const STOP_SUSTAIN_POINTS = 3; // consecutive near-zero-speed points that split a trip

/**
 * Groups GPS readings (already sorted ascending by timestamp) into
 * "trips" using a simple, pragmatic heuristic:
 *   - a new trip starts whenever the time gap since the previous point
 *     exceeds GAP_MINUTES, OR
 *   - the vehicle has been reporting ~0 speed for STOP_SUSTAIN_POINTS
 *     consecutive readings in a row (sustained stop).
 * Distance is the sum of haversine distances between consecutive points
 * within the same trip. This is intentionally simple — it does not
 * attempt map-matching or GPS-noise filtering, it just needs to be
 * functional for the dashboard/reporting use case.
 */
export function computeTrips(points: TripPoint[]): Trip[] {
  const trips: Trip[] = [];
  if (points.length === 0) return trips;

  let current: TripPoint[] = [points[0]];
  let stoppedStreak = points[0].speedKph <= STOP_SPEED_KPH ? 1 : 0;

  const flush = () => {
    if (current.length === 0) return;
    const startTime = current[0].timestamp;
    const endTime = current[current.length - 1].timestamp;
    let distanceKm = 0;
    for (let i = 1; i < current.length; i++) {
      distanceKm += haversineKm(
        current[i - 1].lat,
        current[i - 1].lng,
        current[i].lat,
        current[i].lng
      );
    }
    const durationMinutes = Math.max(
      0,
      (endTime.getTime() - startTime.getTime()) / 60000
    );
    const avgSpeedKph =
      current.reduce((sum, p) => sum + p.speedKph, 0) / current.length;

    // Skip degenerate single-point "trips" with no meaningful data.
    if (current.length > 1) {
      trips.push({ startTime, endTime, distanceKm, avgSpeedKph, durationMinutes });
    }
  };

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const point = points[i];
    const gapMinutes =
      (point.timestamp.getTime() - prev.timestamp.getTime()) / 60000;

    stoppedStreak = point.speedKph <= STOP_SPEED_KPH ? stoppedStreak + 1 : 0;

    const shouldSplit = gapMinutes > GAP_MINUTES || stoppedStreak >= STOP_SUSTAIN_POINTS;

    if (shouldSplit) {
      flush();
      current = [point];
      stoppedStreak = point.speedKph <= STOP_SPEED_KPH ? 1 : 0;
    } else {
      current.push(point);
    }
  }
  flush();

  return trips;
}
