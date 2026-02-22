require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

/* ==============================
   Serve Frontend
================================ */
const clientPath = path.join(__dirname, "..", "client");
app.use(express.static(clientPath));

/* ==============================
   AI EMERGENCY ANALYSIS
================================ */
app.post("/analyze", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "No message provided." });
        }

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-4o-mini", // Stable + recommended
                messages: [
                    {
                        role: "system",
                        content: `
You are an emergency medical AI.

Analyze the user message and respond ONLY in valid JSON format like this:

{
  "severity": "LOW | MEDIUM | CRITICAL",
  "explanation": "short medical reasoning",
  "recommended_action": "what the user should do immediately"
}

Do not add extra text. Only JSON.
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
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
                recommended_action: "Seek medical advice."
            };
        }

        res.json(parsedResponse);

    } catch (error) {
        console.error("OpenRouter Error:", error.response?.data || error.message);
        res.status(500).json({ error: "AI analysis failed." });
    }
});

/* ==============================
   GEOAPIFY NEARBY HOSPITALS
================================ */
app.get("/nearby-hospitals", async (req, res) => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({ error: "Missing coordinates." });
        }

        const geoResponse = await axios.get(
            "https://api.geoapify.com/v2/places",
            {
                params: {
                    categories: "healthcare.hospital",
                    filter: `circle:${lon},${lat},5000`, // 5km radius
                    limit: 5,
                    apiKey: process.env.GEOAPIFY_API_KEY
                }
            }
        );

        const hospitals = geoResponse.data.features.map(place => ({
            name: place.properties.name || "Unnamed Hospital",
            address: place.properties.formatted || "Address unavailable",
            distance: place.properties.distance || 0,
            lat: place.properties.lat,
            lon: place.properties.lon
        }));

        res.json(hospitals);

    } catch (error) {
        console.error("Geoapify Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch hospitals." });
    }
});

/* ==============================
   START SERVER
================================ */
const PORT = 5000;

app.listen(PORT, () => {
    console.log("🚀 Server running at http://localhost:" + PORT);
});