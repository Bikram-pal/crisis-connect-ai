const detectBtn = document.getElementById("detectBtn");
const sosBtn = document.getElementById("sosBtn");

if (detectBtn) {
  detectBtn.addEventListener("click", async () => {

    const description = document.getElementById("description").value;

    if (!description) {
      alert("Please describe the emergency.");
      return;
    }

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });

    const data = await response.json();

    document.getElementById("resultSection").style.display = "block";

    document.getElementById("severityBadge").innerText = data.severity;
    document.getElementById("severityMessage").innerText = data.type;

    const hospitalContainer = document.getElementById("hospitalContainer");
    hospitalContainer.innerHTML = "";

    if (data.hospitals) {
      data.hospitals.forEach(h => {
        hospitalContainer.innerHTML += `
          <div>
            <h4>${h.name}</h4>
            <p>${h.distance} • ${h.eta}</p>
          </div>
        `;
      });
    }
  });
}

if (sosBtn) {
  sosBtn.addEventListener("click", async () => {

    const response = await fetch("/api/sos", {
      method: "POST"
    });

    const data = await response.json();

    localStorage.setItem("incidentId", data.id);
    window.location.href = "sos.html";
  });
}