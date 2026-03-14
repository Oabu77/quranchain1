// ══════════════════════════════════════════════════════════════
// DarCloud™ Masjid Finder — Global Mosque Geo-Location Service
// Uses OpenStreetMap Overpass API (free, no key needed)
// Part of DarCloud Empire — Omar Mohammad Abunadi
// ══════════════════════════════════════════════════════════════

const OVERPASS_API = "https://overpass-api.de/api/interpreter";
const NOMINATIM_API = "https://nominatim.openstreetmap.org";

// ── Geocode a city/address to lat/lon ─────────────────────
async function geocode(query) {
  const url = `${NOMINATIM_API}/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "DarCloud-MasjidFinder/1.0 (darcloud.host)" },
  });
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

// ── Find mosques near a lat/lon using Overpass API ────────
async function findMosquesNearby(lat, lon, radiusKm = 10, limit = 10) {
  const radiusM = radiusKm * 1000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});
      node["building"="mosque"](around:${radiusM},${lat},${lon});
      way["building"="mosque"](around:${radiusM},${lat},${lon});
    );
    out center body ${limit};
  `;

  const res = await fetch(OVERPASS_API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error("Overpass API error");
  const data = await res.json();

  return data.elements.map((el) => {
    const elLat = el.lat || el.center?.lat;
    const elLon = el.lon || el.center?.lon;
    const dist = elLat && elLon ? haversine(lat, lon, elLat, elLon) : null;
    return {
      name: el.tags?.name || el.tags?.["name:en"] || el.tags?.["name:ar"] || "Unknown Masjid",
      nameAr: el.tags?.["name:ar"] || null,
      lat: elLat,
      lon: elLon,
      distance: dist,
      address: el.tags?.["addr:street"]
        ? `${el.tags["addr:housenumber"] || ""} ${el.tags["addr:street"]}, ${el.tags["addr:city"] || ""}`.trim()
        : null,
      phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
      website: el.tags?.website || el.tags?.["contact:website"] || null,
      openingHours: el.tags?.opening_hours || null,
      osmId: el.id,
    };
  }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
}

// ── Calculate Qibla direction from a point ────────────────
function getQiblaDirection(lat, lon) {
  // Kaaba coordinates
  const kaabaLat = 21.4225;
  const kaabaLon = 39.8262;

  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = (kaabaLat * Math.PI) / 180;
  const lon2 = (kaabaLon * Math.PI) / 180;

  const dLon = lon2 - lon1;
  const x = Math.sin(dLon) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  const compass = getCompassDirection(bearing);
  const distToKaaba = haversine(lat, lon, kaabaLat, kaabaLon);

  return { bearing: Math.round(bearing * 10) / 10, compass, distToKaaba: Math.round(distToKaaba) };
}

// ── Haversine distance (km) ───────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Compass direction from bearing ────────────────────────
function getCompassDirection(bearing) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(bearing / 22.5) % 16];
}

// ── Get prayer times (using Aladhan API — free) ───────────
async function getPrayerTimes(lat, lon, method = 2) {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();

  const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Prayer times API error");
  const data = await res.json();

  if (data.code !== 200) throw new Error("Invalid prayer times response");

  const t = data.data.timings;
  return {
    fajr: t.Fajr,
    sunrise: t.Sunrise,
    dhuhr: t.Dhuhr,
    asr: t.Asr,
    maghrib: t.Maghrib,
    isha: t.Isha,
    date: data.data.date.readable,
    hijri: `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} AH`,
    method: data.data.meta.method.name,
  };
}

// ── Search by country for marketing/outreach ──────────────
async function countMosquesByCity(city) {
  const geo = await geocode(city);
  if (!geo) return { city, count: 0, error: "City not found" };

  const mosques = await findMosquesNearby(geo.lat, geo.lon, 25, 50);
  return {
    city,
    displayName: geo.displayName,
    count: mosques.length,
    mosques: mosques.slice(0, 10),
    lat: geo.lat,
    lon: geo.lon,
  };
}

// ── Generate Google Maps link ─────────────────────────────
function mapsLink(lat, lon, name) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

// ── Format mosque list for Discord embed ──────────────────
function formatMosqueList(mosques, maxItems = 8) {
  if (!mosques.length) return "No mosques found in this area.";

  return mosques
    .slice(0, maxItems)
    .map((m, i) => {
      const dist = m.distance ? ` (${m.distance.toFixed(1)} km)` : "";
      const link = m.lat && m.lon ? ` [📍 Map](${mapsLink(m.lat, m.lon, m.name)})` : "";
      const ar = m.nameAr ? ` — ${m.nameAr}` : "";
      return `**${i + 1}.** ${m.name}${ar}${dist}${link}`;
    })
    .join("\n");
}

// ── DarCloud signup CTA for mosque outreach ───────────────
function getSignupCTA() {
  return (
    "\n\n🌙 **Join DarCloud — The Islamic Digital Economy**\n" +
    "• Halal banking with [DarNas](https://darnas.darcloud.host)\n" +
    "• Blockchain rewards with [QuranChain](https://blockchain.darcloud.host)\n" +
    "• Islamic education at [DarEdu](https://edu.darcloud.host)\n" +
    "• Halal investments at [HWC](https://hwc.darcloud.host)\n" +
    "• Community at [Discord](https://discord.gg/darcloud)\n" +
    "\n[**Sign Up Free →**](https://darcloud.host/signup)"
  );
}

module.exports = {
  geocode,
  findMosquesNearby,
  getQiblaDirection,
  getPrayerTimes,
  countMosquesByCity,
  mapsLink,
  formatMosqueList,
  getSignupCTA,
  haversine,
};
