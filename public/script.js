// ----------------------------------------------------
// 0. Mapbox access token
// ----------------------------------------------------
const ACCESS_TOKEN =
  "pk.eyJ1IjoiYWRhdzA5MjQiLCJhIjoiY20zNXk2NWRiMGd6cTJqcTNwM2RhZDNobiJ9.V551B3W1NySsNM0xQoHRkQ";

// ----------------------------------------------------
// 1. Grab HTML elements
// ----------------------------------------------------
const placeInput = document.getElementById("place");
const textInput = document.getElementById("text");
const submitButton = document.getElementById("submit");
const memoriesDiv = document.getElementById("memories");
const memoryForm = document.getElementById("memory-form");

// ----------------------------------------------------
// 2. State
// ----------------------------------------------------
let selectedCoords = null;
let tempMarker = null;
const markersById = new Map();

// ----------------------------------------------------
// 3. Create map
// ----------------------------------------------------
mapboxgl.accessToken = ACCESS_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-79.38, 43.65],
  zoom: 11
});

map.addControl(new mapboxgl.NavigationControl());

// ----------------------------------------------------
// 4. Choose location by clicking map
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
// 5. Render memory (pin + list)
// ----------------------------------------------------
function renderMemory(memory) {
  // ----- Pin -----
  if (memory.lat != null && memory.lng != null) {
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

  // ----- List item -----
  const div = document.createElement("div");
  div.className = "memory-card";
  div.style.cursor = "pointer";

  div.innerHTML = `
    <h4>${memory.place}</h4>
    <p>${memory.text}</p>
    <small>${new Date(memory.createdAt).toLocaleString()}</small>
  `;

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
// 6. Fetch memories
// ----------------------------------------------------
async function fetchMemories() {
  memoriesDiv.innerHTML = "";
  markersById.clear();

  try {
    const response = await fetch("/data");
    if (!response.ok) throw new Error("Fetch failed");

    const memories = await response.json();

    if (!memories.length) {
      memoriesDiv.innerHTML = "<p>No memories yet.</p>";
      return;
    }

    memories.forEach(renderMemory);
  } catch (err) {
    console.error(err);
    memoriesDiv.innerHTML = "<p>Could not load memories.</p>";
  }
}

// ----------------------------------------------------
// 7. Save memory
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
    const response = await fetch("/data", {
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
      alert("Failed to save memory");
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
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}

// ----------------------------------------------------
// 8. Events
// ----------------------------------------------------
submitButton.addEventListener("click", postMemory);

window.addEventListener("load", () => {
  memoryForm.classList.add("hidden");
  fetchMemories();
});
