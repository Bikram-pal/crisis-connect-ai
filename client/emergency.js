document.addEventListener("DOMContentLoaded", () => {

    const detectBtn = document.getElementById("detectBtn");
    const inputBox = document.getElementById("emergencyInput");

    const severitySection = document.getElementById("severitySection");
    const severityLevel = document.getElementById("severityLevel");
    const severityExplanation = document.getElementById("severityExplanation");

    const sosBtn = document.getElementById("sosBtn");
    const micBtn = document.getElementById("micBtn");

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

                severityLevel.textContent = data.severity || "UNKNOWN";
                severityExplanation.textContent = data.explanation || "";

                severitySection.classList.remove("hidden");

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

    /* ===========================
       VOICE TO TEXT
    =========================== */

    if (micBtn && inputBox) {

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.log("Speech recognition not supported.");
            micBtn.style.display = "none";
        } else {

            const recognition = new SpeechRecognition();
            recognition.lang = "en-US";
            recognition.interimResults = false;
            recognition.continuous = false;

            recognition.onstart = function () {
                micBtn.innerText = "🎙️";
            };

            recognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                inputBox.value = transcript;
            };

            recognition.onerror = function (event) {
                console.error("Voice error:", event.error);
                alert("Voice error: " + event.error);
            };

            recognition.onend = function () {
                micBtn.innerText = "🎤";
            };

            micBtn.addEventListener("click", () => {
                recognition.start();
            });
        }
    }

});


/* ===========================
   HOSPITAL LOADER
=========================== */

async function loadNearbyHospitals() {

    try {

        if (!navigator.geolocation) {
            alert("Geolocation not supported.");
            return;
        }

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

        const response = await fetch(`/nearby-hospitals?lat=${lat}&lon=${lon}`);
        const hospitals = await response.json();

        if (!hospitals || hospitals.length === 0) {
            alert("No nearby hospitals found.");
            return;
        }

        hospitals.slice(0, 3).forEach((hospital, index) => {

            const nameEl = document.getElementById(`hospitalName${index + 1}`);
            const distEl = document.getElementById(`hospitalDistance${index + 1}`);
            const navBtn = document.getElementById(`navigateBtn${index + 1}`);

            if (nameEl) {
                nameEl.textContent = hospital.name || "Unnamed Hospital";
            }

            console.log("hospital.distance:", hospital.distance);

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
            "Location access is required.\n\n" +
            "Please allow location permission and refresh."
        );
    }
}