// Haversine formula — returns straight-line distance in km
function getStraightDistanceKm(fromLat, fromLng, toLat, toLng) {
  const R     = 6371;
  const dLat  = ((toLat - fromLat) * Math.PI) / 180;
  const dLng  = ((toLng - fromLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
    Math.cos((toLat   * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Road distance is always longer than straight line
// 1.3 is a standard correction factor (used by Ola/Uber internally)
function getRoadDistanceKm(straightKm) {
  return straightKm * 1.3;
}

// Parse & validate coordinate query params
function parseCoords(query) {
  const { fromLat, fromLng, toLat, toLng } = query;
  const parsed = {
    fromLat: parseFloat(fromLat),
    fromLng: parseFloat(fromLng),
    toLat:   parseFloat(toLat),
    toLng:   parseFloat(toLng),
  };

  const hasAll    = Object.values(parsed).every((v) => !isNaN(v));
  const inRange   =
    parsed.fromLat >= -90  && parsed.fromLat <= 90  &&
    parsed.toLat   >= -90  && parsed.toLat   <= 90  &&
    parsed.fromLng >= -180 && parsed.fromLng <= 180 &&
    parsed.toLng   >= -180 && parsed.toLng   <= 180;

  return { coords: parsed, isValid: hasAll && inRange };
}

module.exports = { getStraightDistanceKm, getRoadDistanceKm, parseCoords };