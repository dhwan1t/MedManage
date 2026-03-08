/**
 * Shared geospatial utilities.
 *
 * P2-01: Extracted from server/routes/public.js and server/ai/hospitalRanker.js
 * to eliminate the duplicated getDistance function.
 */

/**
 * Haversine distance between two lat/lng points in kilometers.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} Distance in kilometers
 */
function getDistance(lat1, lng1, lat2, lng2) {
  // Guard: if any coordinate is null, undefined, or NaN, return a safe fallback
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null ||
    isNaN(lat1) ||
    isNaN(lng1) ||
    isNaN(lat2) ||
    isNaN(lng2)
  ) {
    return 5.0; // Default fallback distance in km
  }

  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { getDistance };
