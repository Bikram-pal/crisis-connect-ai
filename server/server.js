require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* ==============================
   Distance Helper (Haversine)
================================ */
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const earthRadiusMeters = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
}

/* ==============================
   Serve Frontend
================================ */
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

/* ==============================
   Health Check Route
================================ */
app.get("/health", (req, res) => {
    res.json({ status: "Server is running" });
});

/* ==============================
   AI EMERGENCY ANALYSIS
================================ */
const analyzeHandler = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "No message provided." });
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `
You are an emergency medical AI.

Respond ONLY in valid JSON format:

{
  "severity": "LOW | MEDIUM | CRITICAL",
  "explanation": "short reasoning",
  "recommended_action": "immediate action"
}

No extra text.
                        `
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiText = response.data.choices[0].message.content.trim();

        let parsedResponse;

        try {
            parsedResponse = JSON.parse(aiText);
        } catch {
            parsedResponse = {
                severity: "UNKNOWN",
                explanation: aiText,
                recommended_action: "Seek medical advice immediately."
            };
        }

        res.json(parsedResponse);

    } catch (error) {
        console.error("OpenRouter Error:", error.response?.data || error.message);
        res.status(500).json({ error: "AI analysis failed." });
    }
};

app.post("/analyze", analyzeHandler);
app.post("/api/analyze", analyzeHandler);

/* ==============================
   GEOAPIFY NEARBY HOSPITALS
================================ */
app.get("/nearby-hospitals", async (req, res) => {
    try {
        const userLat = Number.parseFloat(req.query.lat);
        const userLon = Number.parseFloat(req.query.lon);

        if (!Number.isFinite(userLat) || !Number.isFinite(userLon)) {
            return res.status(400).json({ error: "Missing coordinates." });
        }

        console.log("User:", userLat, userLon);

        const geoResponse = await axios.get(
            "https://api.geoapify.com/v2/places",
            {
                params: {
                    categories: "healthcare.hospital",
                    filter: `circle:${userLon},${userLat},5000`,
                    limit: 5,
                    apiKey: process.env.GEOAPIFY_API_KEY
                }
            }
        );

        const hospitals = geoResponse.data.features.map(place => {
            const hospitalLat = Number.parseFloat(place.properties.lat);
            const hospitalLon = Number.parseFloat(place.properties.lon);
            const distance =
                Number.isFinite(hospitalLat) && Number.isFinite(hospitalLon)
                    ? getDistanceMeters(userLat, userLon, hospitalLat, hospitalLon)
                    : null;

            console.log("Hospital:", hospitalLat, hospitalLon);
            console.log("Distance:", distance);

            return {
                name: place.properties.name || "Unnamed Hospital",
                address: place.properties.formatted || "Address unavailable",
                distance,
                lat: hospitalLat,
                lon: hospitalLon
            };
        });

        hospitals.sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });

        res.json(hospitals);

    } catch (error) {
        console.error("Geoapify Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch hospitals." });
    }
});

/* ==============================
   Fallback Route (Frontend Safe)
================================ */
app.use((req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
});

/* ==============================
   START SERVER (Render Safe)
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});