const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const PLACE_FIELDS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.primaryTypeDisplayName",
  "places.businessStatus"
].join(",");

function numberOrZero(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function scoreGoogleLead(place) {
  let score = 25;
  if (place.phone) score += 20;
  if (place.website) score += 15;
  if (place.rating >= 4) score += 15;
  if (place.reviewCount >= 50) score += 10;
  if (!place.website) score += 10;
  if (place.googleMapsUri) score += 5;
  return Math.min(score, 100);
}

export function normalizeGooglePlace(place, searchQuery = "") {
  const name = place.displayName?.text || "Unnamed business";
  const normalized = {
    source: "google_maps",
    placeId: place.id || "",
    businessName: name,
    category: place.primaryTypeDisplayName?.text || "",
    address: place.formattedAddress || "",
    location: place.formattedAddress || "",
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
    website: place.websiteUri || "",
    googleMapsUri: place.googleMapsUri || "",
    rating: numberOrZero(place.rating),
    reviewCount: numberOrZero(place.userRatingCount),
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    searchQuery,
    dataExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString()
  };
  return { ...normalized, score: scoreGoogleLead(normalized) };
}

export async function searchGooglePlaces({ keyword = "", industry = "", location = "", pageSize = 12 }) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return {
      configured: false,
      results: [],
      message: "Add GOOGLE_MAPS_API_KEY in Vercel to enable Google Maps lead discovery."
    };
  }

  const textQuery = [keyword, industry, location].filter(Boolean).join(" ").trim();
  if (!textQuery) {
    return { configured: true, results: [], message: "Enter an industry, keyword, or location." };
  }

  const response = await fetch(PLACES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_FIELDS
    },
    body: JSON.stringify({ textQuery, pageSize: Math.min(Number(pageSize || 12), 20) })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      configured: true,
      results: [],
      message: data.error?.message || "Google Places search failed. Check API key, billing, and Places API access."
    };
  }

  return {
    configured: true,
    query: textQuery,
    results: (data.places || []).map((place) => normalizeGooglePlace(place, textQuery)),
    attribution: "Powered by Google Places"
  };
}
