// ==============================
// HAVERSINE FUNCTION
// ==============================

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => deg * Math.PI / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}


// ==============================
// NEARBY HOSPITALS USING GEO API
// ==============================

app.get("/nearby-hospitals", async (req, res) => {

  try {

    const userLat = parseFloat(req.query.lat);
    const userLon = parseFloat(req.query.lon);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({ error: "Invalid coordinates" });
    }

    // Overpass API query
    const overpassQuery = `
      [out:json];
      node["amenity"="hospital"](around:5000,${userLat},${userLon});
      out;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery
    });

    const data = await response.json();

    if (!data.elements) {
      return res.json([]);
    }

    const hospitals = data.elements.map(h => {

      const distance = getDistance(
        userLat,
        userLon,
        h.lat,
        h.lon
      );

      return {
        name: h.tags?.name || "Unnamed Hospital",
        lat: h.lat,
        lon: h.lon,
        distance: distance
      };
    });

    // Sort nearest first
    hospitals.sort((a, b) => a.distance - b.distance);

    res.json(hospitals.slice(0, 5));

  } catch (error) {
    console.error("Geo API Error:", error);
    res.status(500).json({ error: "Failed to fetch hospitals" });
  }
});