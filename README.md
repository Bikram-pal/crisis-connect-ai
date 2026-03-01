## 🚑 CrisisConnect AI

An AI-powered emergency response web application that:
- Analyzes emergency descriptions using AI
- Detects severity level (LOW / MEDIUM / CRITICAL)
- Finds nearest hospitals based on real-time location
- Provides Google Maps navigation
- Supports voice input for emergency reporting

---

## 🌍 Live Demo

https://crisis-connect-ai.vercel.app/

---

## 🧠 Features

### 🔍 AI Emergency Analysis
- Uses OpenRouter API (GPT-4o-mini)
- Returns structured JSON severity
- Provides reasoning and recommended action

### 📍 Real-Time Location
- Uses browser geolocation API
- High accuracy mode enabled
- No cached coordinates

### 🏥 Nearby Hospitals
- Uses Geoapify Places API
- Custom Haversine distance calculation
- Sorted by closest hospital
- Configurable radius (currently 20km)

### 🎤 Voice Input
- Web Speech API (Chrome-supported)
- Converts speech → text automatically

### 🗺 Navigation
- One-click Google Maps directions
- Uses user location as origin

---

## 🛠 Tech Stack

### Frontend
- HTML
- Tailwind CSS
- Vanilla JavaScript

### Backend
- Node.js
- Express.js
- Axios
- Geoapify API
- OpenRouter API

### Deployment
- Frontend: Vercel
- Backend: Render

---

## 📂 Project Structure
