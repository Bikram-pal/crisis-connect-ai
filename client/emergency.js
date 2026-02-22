document.addEventListener("DOMContentLoaded", () => {

    const detectBtn = document.getElementById("detectBtn");
    const inputBox = document.querySelector("textarea");

    const severitySection = document.getElementById("severitySection");
    const severityLevel = document.getElementById("severityLevel");
    const severityExplanation = document.getElementById("severityExplanation");

    /* ===========================
       AI EMERGENCY ANALYSIS
    =========================== */

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

        } catch (error) {
            console.error("AI error:", error);
            alert("AI analysis failed.");
        }

        detectBtn.innerText = "Detect Emergency";
        detectBtn.disabled = false;
    });


    /* ===========================
       LOAD NEARBY HOSPITALS
    =========================== */

    loadNearbyHospitals();
});


async function loadNearbyHospitals() {

    try {

        let lat = 20.2961;
        let lon = 85.8245;

        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                lat = position.coords.latitude;
                lon = position.coords.longitude;

            } catch (err) {
                console.log("Location denied. Using default.");
            }
        }

        const response = await fetch(`/nearby-hospitals?lat=${lat}&lon=${lon}`);
        const hospitals = await response.json();

        console.log("Nearby hospitals:", hospitals);

        hospitals.slice(0, 3).forEach((hospital, index) => {

            const nameEl = document.getElementById(`hospitalName${index + 1}`);
            const distEl = document.getElementById(`hospitalDistance${index + 1}`);

            if (nameEl) {
                nameEl.textContent = hospital.name;
            }

            if (distEl && hospital.distance) {
                const km = (hospital.distance / 1000).toFixed(2);
                distEl.textContent = `${km} km away`;
            }
        });

    } catch (error) {
        console.error("Hospital load error:", error);
    }
}