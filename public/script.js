// 0. Mapbox access token (same one you used before)
const ACCESS_TOKEN =
  "pk.eyJ1IjoiYWRhdzA5MjQiLCJhIjoiY20zNXk2NWRiMGd6cTJqcTNwM2RhZDNobiJ9.V551B3W1NySsNM0xQoHRkQ";

// 1. Grab the HTML elements we need
const placeInput = document.getElementById("place");
const textInput = document.getElementById("text");
const submitButton = document.getElementById("submit");
const memoriesDiv = document.getElementById("memories");
const memoryForm = document.getElementById('memory-form');

// 2. Function: show 1 memory on the page
function renderMemory(memory) {
  const div = document.createElement("div");
  div.className = "memory-card";

  const dateText = memory.createdAt
    ? new Date(memory.createdAt).toLocaleString()
    : "";

  div.innerHTML = `
    <h4>${memory.place}</h4>
    <p>${memory.text}</p>
    <small>${dateText}</small>
    <hr/>
  `;

  memoriesDiv.appendChild(div);
}

// 3. Function: get memories from database and display them
async function fetchMemories() {
  memoriesDiv.innerHTML = ""; // clear old memories first

  try {
    const response = await fetch("/data");
    if (!response.ok) throw new Error("Network response was not ok");

    const memories = await response.json();

    if (!Array.isArray(memories) || memories.length === 0) {
      memoriesDiv.innerHTML = "<p>No memories yet. Be the first!</p>";
      return;
    }

    memories.reverse().forEach(renderMemory);
  } catch (error) {
    console.error("Error fetching memories:", error);
    memoriesDiv.innerHTML = "<p>Could not load memories.</p>";
  }
}

// 4. Function: send a new memory to database
async function postMemory() {
  const place = placeInput.value.trim();
  const text = textInput.value.trim();

  if (!place || !text) {
    alert("Please fill in both the place and the memory.");
    return;
  }

  try {
    const response = await fetch("/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ place, text })
    });

    if (!response.ok) {
      let errText = "unknown error";
      try {
        const err = await response.json();
        errText = err.error || errText;
      } catch (e) {}
      alert("Error saving memory: " + errText);
      return;
    }
    // Reset the form to clear values and reset browser validation state
    if (memoryForm && typeof memoryForm.reset === 'function') {
      memoryForm.reset();
    } else {
      placeInput.value = "";
      textInput.value = "";
    }

    // Move focus away from inputs so invalid styles don't appear immediately
    try { submitButton.focus(); } catch (e) {}

    fetchMemories();
  } catch (error) {
    console.error("Error posting memory:", error);
    alert("Something went wrong while saving.");
  }
}

// 5. When user clicks Share, run postMemory()
submitButton.addEventListener("click", postMemory);

// 6. On window load:
//    - give Mapbox the access token
//    - let Mapbox wire up the autofill
//    - fetch existing memories
window.addEventListener("load", () => {
  const autofillEl = document.querySelector("mapbox-address-autofill");
  if (autofillEl) {
    autofillEl.accessToken = ACCESS_TOKEN;
  }

  // If you later add more address fields, you can also use the global config:
  // if (window.mapboxsearch) {
  //   mapboxsearch.config.accessToken = ACCESS_TOKEN;
  // }

  fetchMemories();
});
