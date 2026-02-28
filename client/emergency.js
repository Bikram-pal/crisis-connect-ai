document.addEventListener("DOMContentLoaded", () => {

    const detectBtn = document.getElementById("detectBtn");
    const inputBox = document.getElementById("emergencyInput");

    const severitySection = document.getElementById("severitySection");
    const severityLevel = document.getElementById("severityLevel");
    const severityExplanation = document.getElementById("severityExplanation");

    const sosBtn = document.getElementById("sosBtn");

    /* ===========================
       AI EMERGENCY ANALYSIS
    =========================== */

    if (detectBtn) {
        detectBtn.addEventListener("click", async () => {

            const message = inputBox.value.trim();

            if (!message) {
                alert("Please describe the emergency first.");
                return;
            }

            detectBtn.innerText = "Analyzing...";
            detectBtn.disabled = true;

            try {

                const response = await fetch("/analyze", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();

                severityLevel.textContent = data.severity;
                severityExplanation.textContent = data.explanation;

                severitySection.classList.remove("hidden");

                // 🔥 Load hospitals only after AI result
                await loadNearbyHospitals();

            } catch (error) {
                console.error("AI error:", error);
                alert("AI analysis failed.");
            }

            detectBtn.innerText = "Detect Emergency";
            detectBtn.disabled = false;
        });
    }

    /* ===========================
       SOS REDIRECT
    =========================== */

    if (sosBtn) {
        sosBtn.addEventListener("click", () => {
            window.location.href = "sos.html";
        });
    }

});
    

/* ===========================
   HOSPITAL LOADER
=========================== */

async function loadNearbyHospitals() {

    try {

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        // 🔥 FORCE REAL-TIME LOCATION (NO CACHE)
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        console.log("User Latitude:", lat);
        console.log("User Longitude:", lon);

        // 🔥 Fetch hospitals from backend
        const response = await fetch(`/nearby-hospitals?lat=${lat}&lon=${lon}`);
        const hospitals = await response.json();

        if (!hospitals || hospitals.length === 0) {
            alert("No nearby hospitals found.");
            return;
        }

        // 🔥 Clear previous values first
        for (let i = 1; i <= 3; i++) {
            const nameEl = document.getElementById(`hospitalName${i}`);
            const distEl = document.getElementById(`hospitalDistance${i}`);
            if (nameEl) nameEl.textContent = "Loading...";
            if (distEl) distEl.textContent = "";
        }

        hospitals.slice(0, 3).forEach((hospital, index) => {

            const nameEl = document.getElementById(`hospitalName${index + 1}`);
            const distEl = document.getElementById(`hospitalDistance${index + 1}`);
            const navBtn = document.getElementById(`navigateBtn${index + 1}`);

            if (nameEl) {
                nameEl.textContent = hospital.name || "Unnamed Hospital";
            }

            if (distEl && typeof hospital.distance === "number") {
                const km = (hospital.distance / 1000).toFixed(2);
                distEl.textContent = `${km} km away`;
            }

            if (navBtn) {

                navBtn.onclick = () => {

                    const mapURL =
                        `https://www.google.com/maps/dir/?api=1` +
                        `&origin=${lat},${lon}` +
                        `&destination=${hospital.lat},${hospital.lon}`;

                    window.open(mapURL, "_blank");
                };
            }

        });

    } catch (error) {

        console.error("Hospital load error:", error);

        alert(
            "Location access is required to fetch nearby hospitals.\n\n" +
            "Please allow location permission and refresh the page."
        );
    }
}
