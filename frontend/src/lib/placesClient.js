/**
 * Direct Google Places API client for BazaarMind.
 * Enables live neighborhood market discovery using the verified Google Maps API Key.
 */

const GOOGLE_MAPS_API_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

/**
 * Haversine formula to calculate distance in kilometers.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Direct Google Places search nearby.
 */
export async function directDiscoverMarkets(lat, lng, radiusKm = 10) {
  if (!GOOGLE_MAPS_API_KEY) {
    return { configured: false, places: [] };
  }

  const endpoint = "https://places.googleapis.com/v1/places:searchNearby";
  const radiusMeters = Math.min(Math.max(radiusKm * 1000, 500), 50000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.location,places.formattedAddress,places.types,places.googleMapsUri",
      },
      body: JSON.stringify({
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
        includedTypes: ["market", "grocery_store", "supermarket"],
      }),
    });

    if (!response.ok) {
      console.warn("Google Places API error:", response.status);
      return { configured: false, places: [] };
    }

    const data = await response.json();
    const places = (data.places || []).map((p) => {
      const placeLat = p.location?.latitude;
      const placeLng = p.location?.longitude;
      const dist =
        placeLat != null && placeLng != null
          ? calculateDistanceKm(lat, lng, placeLat, placeLng)
          : null;

      return {
        id: `google-${p.id}`,
        placeId: p.id,
        externalPlaceId: p.id,
        name: p.displayName?.text || "Local Market",
        area: p.formattedAddress || "Delhi NCR",
        address: p.formattedAddress || null,
        lat: placeLat,
        lng: placeLng,
        distanceKm: dist,
        types: p.types || [],
        googleMapsUri: p.googleMapsUri || null,
        provider: "GOOGLE_PLACES",
        intelligenceAvailable: false,
        discoveryOnly: true,
      };
    });

    return {
      configured: true,
      provider: "GOOGLE_PLACES",
      places,
      markets: places,
    };
  } catch (err) {
    console.error("directDiscoverMarkets error:", err);
    return { configured: false, places: [] };
  }
}
