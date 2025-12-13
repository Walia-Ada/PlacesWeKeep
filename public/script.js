// ----------------------------------------------------
// 0. Mapbox access token
// ----------------------------------------------------
const ACCESS_TOKEN =
  "pk.eyJ1IjoiYWRhdzA5MjQiLCJhIjoiY20zNXk2NWRiMGd6cTJqcTNwM2RhZDNobiJ9.V551B3W1NySsNM0xQoHRkQ";

// ----------------------------------------------------
// 1. Grab HTML elements
// ----------------------------------------------------
const placeInput = document.getElementById("place"); // display only
const textInput = document.getElementById("text");
const submitButton = document.getElementById("submit");
const memoriesDiv = document.getElementById("memories");
const memoryForm = document.getElementById("memory-form");

// ----------------------------------------------------
// 2. Map state
// ----------------------------------------------------
let selectedCoords = null;
let tempMarker = null;

// Keep track of markers by memory id
const markersById = new Map();

// ----------------------------------------------------
// 3. Create the map
// ----------------------------------------------------
mapboxgl.accessToken = ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-79.38, 43.65], // Toronto
  zoom: 11
});

map.addControl(new mapboxgl.NavigationControl());

// ----------------------------------------------------
// 4. Capture map clicks
// ----------------------------------------------------
map.on("click", (e) => {
  selectedCoords = e.lngLat;

  if (tempMarker) tempMarker.remove();

  tempMarker = new mapboxgl.Marker()
    .setLngLat(selectedCoords)
    .addTo(map);

  memoryForm.classList.remove("hidden");

  placeInput.value = `Pinned location: ${selectedCoords.lat.toFixed(
    4
  )}, ${selectedCoords.lng.toFixed(4)}`;
});

// ----------------------------------------------------
// 5. Render ONE memory (pin + list)
// ----------------------------------------------------
function renderMemory(memory) {
  // ---------- Marker ----------
  if (memory.lat && memory.lng) {
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
      <p>${memory.text}</p>
      <small>${new Date(memory.createdAt).toLocaleString()}</small>
    `);

    const marker = new mapboxgl.Marker({ color: "#b86b3a" })
      .setLngLat([memory.lng, memory.lat])
      .setPopup(popup)
      .addTo(map);

    markersById.set(memory.id, marker);
  }

  // ---------- List item ----------
  const div = document.createElement("div");
  div.className = "memory-card";
  div.style.cursor = "pointer";

  div.innerHTML = `
    <h4>${memory.place}</h4>
    <p>${memory.text}</p>
    <small>${new Date(memory.createdAt).toLocaleString()}</small>
  `;

  // ---------- Click list → fly to pin ----------
  div.addEventListener("click", () => {
    if (!memory.lat || !memory.lng) return;

    map.flyTo({
      center: [memory.lng, memory.lat],
      zoom: 15,
      speed: 0.8
    });

    const marker = markersById.get(memory.id);
    if (marker) marker.togglePopup();
  });

  memoriesDiv.appendChild(div);
}

// ----------------------------------------------------
// 6. Fetch memories (FIXED ENDPOINT)
// ----------------------------------------------------
async function fetchMemories() {
  memoriesDiv.innerHTML = "";
  markersById.clear();

  try {
    const response = await fetch("/api/data"); // ✅ FIX
    if (!response.ok) throw new Error("Network error");

    const memories = await response.json();

    if (!memories.length) {
      memoriesDiv.innerHTML = "<p>No memories yet. Be the first!</p>";
      return;
    }

    memories.forEach(renderMemory);
  } catch (error) {
    console.error("Error fetching memories:", error);
    memoriesDiv.innerHTML = "<p>Could not load memories.</p>";
  }
}

// ----------------------------------------------------
// 7. Post a new memory (FIXED ENDPOINT)
// ----------------------------------------------------
async function postMemory() {
  if (!selectedCoords) {
    alert("Click on the map to choose a location.");
    return;
  }

  const text = textInput.value.trim();
  if (!text) {
    alert("Please write a memory.");
    return;
  }

  try {
    const response = await fetch("/api/data", { // ✅ FIX
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place: "Pinned location",
        text,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng
      })
    });

    if (!response.ok) {
      const err = await response.json();
      alert("Error saving memory: " + (err.error || "unknown error"));
      return;
    }

    memoryForm.reset();
    memoryForm.classList.add("hidden");
    selectedCoords = null;

    if (tempMarker) {
      tempMarker.remove();
      tempMarker = null;
    }

    fetchMemories();
  } catch (error) {
    console.error("Error posting memory:", error);
    alert("Something went wrong while saving.");
  }
}

// ----------------------------------------------------
// 8. Button handler
// ----------------------------------------------------
submitButton.addEventListener("click", postMemory);

// ----------------------------------------------------
// 9. On page load
// ----------------------------------------------------
window.addEventListener("load", () => {
  const autofillEl = document.querySelector("mapbox-address-autofill");
  if (autofillEl) {
    autofillEl.accessToken = ACCESS_TOKEN;
  }

  memoryForm.classList.add("hidden");
  fetchMemories();
});
