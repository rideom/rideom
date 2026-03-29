const { getDistance } = require('geolib');

const FARE_CONFIG = {
  BIKE:      { baseFare: 20, perKm: 8,  etaMin: 2 },
  AUTO:      { baseFare: 30, perKm: 12, etaMin: 4 },
  CAR:       { baseFare: 60, perKm: 18, etaMin: 6 },
  ERICKSHAW: { baseFare: 25, perKm: 10, etaMin: 5 },
};

function calculateFareEstimates({ fromLat, fromLng, toLat, toLng }) {
  const distanceMeters = getDistance(
    { latitude: parseFloat(fromLat), longitude: parseFloat(fromLng) },
    { latitude: parseFloat(toLat),   longitude: parseFloat(toLng)   }
  );

  const distanceKm  = distanceMeters / 1000;
  const durationMin = Math.ceil(distanceKm / 0.4);

  const estimates = Object.entries(FARE_CONFIG).map(([type, config]) => {
    const fare = Math.round(config.baseFare + distanceKm * config.perKm);
    return {
      rideType: type.toLowerCase(),
      fare:     { amount: fare,                        display: `₹${fare}`           },
      eta:      { minutes: config.etaMin,              display: `${config.etaMin} min` },
      distance: { km: distanceKm.toFixed(1),           display: `${distanceKm.toFixed(1)} km` },
      duration: { minutes: durationMin,                display: `${durationMin} min` },
    };
  });

  return { estimates, distanceKm, durationMin };
}

module.exports = { calculateFareEstimates };