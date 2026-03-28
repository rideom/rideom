const { FARE_CONFIG, AVG_SPEED_KMPH } = require("../config/fareConfig");
const {
  getStraightDistanceKm,
  getRoadDistanceKm,
} = require("../utils/geoUtils");

// ── Core fare calculation ──
function calculateFare(rideType, distanceKm, durationMin) {
  const config = FARE_CONFIG[rideType];
  if (!config) return null;

  const raw =
    config.baseFare + distanceKm * config.perKm + durationMin * config.perMin;
  const surged = raw * config.surgeMultiplier;
  const final = Math.max(surged, config.minFare);

  return {
    min: Math.round(final * 0.9), // -10%
    max: Math.round(final * 1.1), // +10%
    exact: Math.round(final),
  };
}

// ── ETA in minutes ──
function calculateETA(rideType, distanceKm) {
  const speed = AVG_SPEED_KMPH[rideType] || 25;
  const minutes = (distanceKm / speed) * 60;
  return Math.ceil(minutes);
}

// ── Format a single ride estimate ──
function buildEstimate(rideType, roadKm, durationMin) {
  const fare = calculateFare(rideType, roadKm, durationMin);
  const eta = calculateETA(rideType, roadKm);

  return {
    rideType,
    fare: {
      min: fare.min,
      max: fare.max,
      display: `₹${fare.min}–${fare.max}`,
    },
    eta: {
      minutes: eta,
      display: eta <= 1 ? "1 min" : `${eta} mins`,
    },
    distance: {
      km: parseFloat(roadKm.toFixed(2)),
      display: `${roadKm.toFixed(1)} km`,
    },
  };
}

// ── Service: all ride types ──
function getAllEstimates(fromLat, fromLng, toLat, toLng) {
  const straightKm = getStraightDistanceKm(fromLat, fromLng, toLat, toLng);
  const roadKm = getRoadDistanceKm(straightKm);
  const durationMin = (roadKm / 30) * 60; // avg 30 km/h in city traffic

  const estimates = Object.keys(FARE_CONFIG).map((rideType) =>
    buildEstimate(rideType, roadKm, durationMin),
  );

  return {
    estimates,
    tripDistance: parseFloat(roadKm.toFixed(2)),
  };
}

// ── Service: single ride type ──
function getEstimateByType(rideType, fromLat, fromLng, toLat, toLng) {
  if (!FARE_CONFIG[rideType]) return null;

  const straightKm = getStraightDistanceKm(fromLat, fromLng, toLat, toLng);
  const roadKm = getRoadDistanceKm(straightKm);
  const durationMin = (roadKm / 30) * 60;

  return buildEstimate(rideType, roadKm, durationMin);
}

module.exports = { getAllEstimates, getEstimateByType };
