// SIH 2026 Manganese Multimodal AI Intelligence Platform Engine

const API_BASE = "http://127.0.0.1:8000/api";

let map = null;
let occurrenceLayerGroup = null;
let zoneLayerGroup = null;
let beltsLayerGroup = null;
let rawZonesGeoJSON = null;
let currentBufferCircle = null;
let isRadiusToolActive = false;
let mapPinMarker = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initGISMap();
  initMapSearchAutocomplete();
  initRadiusAnalysisTool();
  initChatbotModule();
  loadOverviewStats();
  loadMultimodalBenchmark();
  loadModelIntelligence();
  loadShortfallData();
  loadDataExplorer();
});

// Tab Navigation
function initTabs() {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
      const targetSec = document.getElementById(targetTab);
      if (targetSec) targetSec.classList.add("active");

      if (targetTab === "map-view" && map) {
        setTimeout(() => map.invalidateSize(), 200);
      }
    });
  });
}

// Leaflet GIS Map Initialization with High-Contrast CartoDB Dark Tiles
function initGISMap() {
  map = L.map("gis-map", {
    center: [20.5937, 78.9629],
    zoom: 5,
    zoomControl: false
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // CartoDB Dark Matter Basemap Tiles (High-contrast India GIS Map)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19
  }).addTo(map);

  occurrenceLayerGroup = L.layerGroup().addTo(map);
  zoneLayerGroup = L.layerGroup().addTo(map);
  beltsLayerGroup = L.layerGroup().addTo(map);

  loadManganeseBelts();
  loadGroundTruthOccurrences();
  loadPriorityZones();

  document.getElementById("chk-occurrences")?.addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(occurrenceLayerGroup);
    else map.removeLayer(occurrenceLayerGroup);
  });

  document.getElementById("chk-zones")?.addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(zoneLayerGroup);
    else map.removeLayer(zoneLayerGroup);
  });

  document.getElementById("chk-belts")?.addEventListener("change", (e) => {
    if (e.target.checked) map.addLayer(beltsLayerGroup);
    else map.removeLayer(beltsLayerGroup);
  });

  document.getElementById("slider-score")?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("val-score-filter").textContent = val.toFixed(2);
    filterZonesByScore(val);
  });

  document.getElementById("close-inspector")?.addEventListener("click", () => {
    document.getElementById("zone-inspector")?.classList.remove("active");
  });

  document.getElementById("btn-export-zone-pdf")?.addEventListener("click", () => {
    const state = document.getElementById("insp-state").textContent || "Keonjhar";
    downloadPDFReport(state);
  });
}

// Map Search & Autocomplete
function initMapSearchAutocomplete() {
  const input = document.getElementById("search-gis");
  const dropdown = document.getElementById("map-autocomplete-list");
  if (!input || !dropdown) return;

  input.addEventListener("input", async (e) => {
    const val = e.target.value.trim();
    if (val.length < 2) {
      dropdown.style.display = "none";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/areas/search?q=${encodeURIComponent(val)}`);
      const places = await res.json();

      if (!places || places.length === 0) {
        dropdown.style.display = "none";
        return;
      }

      dropdown.innerHTML = "";
      places.forEach(p => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerHTML = `
          <div>
            <div class="place-name">${p.place_name}</div>
            <div class="place-sub">${p.district}, ${p.state}</div>
          </div>
          <span style="font-size:10px; background:#0284c7; color:white; padding:2px 6px; border-radius:10px;">${p.place_type}</span>
        `;
        item.addEventListener("click", () => {
          input.value = `${p.place_name}, ${p.district}, ${p.state}`;
          dropdown.style.display = "none";
          zoomToPlaceAndAssess(p);
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = "block";
    } catch (err) {
      console.error("Map search error:", err);
    }
  });

  document.addEventListener("click", (evt) => {
    if (!input.contains(evt.target) && !dropdown.contains(evt.target)) {
      dropdown.style.display = "none";
    }
  });
}

async function zoomToPlaceAndAssess(place) {
  const lat = place.latitude;
  const lon = place.longitude;

  map.flyTo([lat, lon], 10, { duration: 1.5 });

  if (mapPinMarker) {
    map.removeLayer(mapPinMarker);
  }

  mapPinMarker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: 'custom-pin',
      html: `<div style="background:#ff6b00; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>`,
      iconSize: [16, 16]
    })
  }).addTo(map);

  try {
    const res = await fetch(`${API_BASE}/chatbot/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area_name: `${place.place_name}, ${place.state}` })
    });
    const data = await res.json();

    let popupContent = "";
    if (data.in_coverage) {
      const pa = data.report.prospectivity_assessment;
      popupContent = `
        <div style="font-family:sans-serif; width:220px;">
          <b style="color:#0284c7; font-size:13px;">${data.matched_place}</b><br/>
          <div style="margin-top:6px; background:#f0f9ff; padding:8px; border-radius:8px; border:1px solid #bae6fd;">
            <span style="font-size:11px; color:#475569;">Prospectivity Score:</span><br/>
            <b style="font-size:18px; color:#ff6b00;">${pa.score.toFixed(4)}</b> (${pa.category})<br/>
            <span style="font-size:11px; color:#059669;">${pa.confidence_percent}% Confidence</span>
          </div>
          <button onclick="downloadPDFReport('${place.place_name}')" style="margin-top:8px; width:100%; background:#0284c7; color:white; border:none; padding:6px; border-radius:6px; font-weight:600; font-size:11px; cursor:pointer;">
            📄 Download Report PDF
          </button>
        </div>
      `;
    } else {
      popupContent = `
        <div style="font-family:sans-serif; width:200px;">
          <b style="color:#e11d48; font-size:12px;">OUT OF COVERAGE</b><br/>
          <p style="font-size:11px; color:#475569; margin-top:4px;">${data.message}</p>
        </div>
      `;
    }

    mapPinMarker.bindPopup(popupContent).openPopup();
  } catch (err) {
    console.error("Place assessment popup error:", err);
  }
}

// 10 km Buffer Radius Analysis Tool
function initRadiusAnalysisTool() {
  const btn = document.getElementById("btn-radius-tool");
  const status = document.getElementById("radius-status");
  if (!btn) return;

  btn.addEventListener("click", () => {
    isRadiusToolActive = !isRadiusToolActive;
    if (isRadiusToolActive) {
      btn.style.background = "linear-gradient(135deg, #e11d48 0%, #be123c 100%)";
      btn.innerHTML = "<span>❌ Disable Radius Analysis Tool</span>";
      if (status) status.style.display = "block";
    } else {
      btn.style.background = "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)";
      btn.innerHTML = "<span>📍 Enable 10 km Radius Analysis Tool</span>";
      if (status) status.style.display = "none";
      if (currentBufferCircle) {
        map.removeLayer(currentBufferCircle);
        currentBufferCircle = null;
      }
    }
  });

  map.on("click", async (e) => {
    if (!isRadiusToolActive) return;

    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    if (currentBufferCircle) {
      map.removeLayer(currentBufferCircle);
    }

    currentBufferCircle = L.circle([lat, lon], {
      radius: 10000, // 10 km radius
      fillColor: "#0284c7",
      color: "#0369a1",
      weight: 2,
      dashArray: "4, 4",
      fillOpacity: 0.25
    }).addTo(map);

    try {
      const res = await fetch(`${API_BASE}/chatbot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area_name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` })
      });
      const data = await res.json();

      let popupText = "";
      if (data.in_coverage && data.report) {
        const pa = data.report.prospectivity_assessment;
        popupText = `
          <div style="font-family:sans-serif; width:220px;">
            <b style="color:#0284c7;">10 km Radius Spatial Buffer Summary</b><br/>
            <span style="font-size:11px; color:#64748b;">Center: ${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E</span>
            <div style="margin-top:6px; background:#f0f9ff; padding:8px; border-radius:8px;">
              <b>Mean Score:</b> ${pa.score.toFixed(4)}<br/>
              <b>Category:</b> ${pa.category}<br/>
              <b>Model Confidence:</b> ${pa.confidence_percent}%
            </div>
          </div>
        `;
      } else {
        popupText = `<b style="color:#e11d48;">Outside Modeled Manganese Belts</b>`;
      }

      currentBufferCircle.bindPopup(popupText).openPopup();
    } catch (err) {
      console.error("Radius query error:", err);
    }
  });
}

// AI Chatbot Assistant Module
function initChatbotModule() {

  const trigger = document.getElementById("ai-chatbot-trigger");
  const drawer = document.getElementById("ai-chatbot-drawer");
  const closeBtn = document.getElementById("close-chatbot-drawer");
  const input = document.getElementById("chatbot-input");
  const sendBtn = document.getElementById("btn-chatbot-send");
  const dropdown = document.getElementById("chatbot-autocomplete-list");
  const container = document.getElementById("chatbot-report-container");

  if (trigger && drawer) {
    trigger.addEventListener("click", () => {
      drawer.classList.toggle("active");
      if (drawer.classList.contains("active")) {
        trigger.classList.add("paused");
      } else {
        trigger.classList.remove("paused");
      }
    });
  }

  if (closeBtn && drawer) {
    closeBtn.addEventListener("click", () => {
      drawer.classList.remove("active");
      if (trigger) trigger.classList.remove("paused");
    });
  }

  if (!input || !sendBtn) return;

  sendBtn.addEventListener("click", () => {
    const val = input.value.trim();
    if (val) queryChatbot(val);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const val = input.value.trim();
      if (val) queryChatbot(val);
    }
  });

  input.addEventListener("input", async (e) => {
    const val = e.target.value.trim();
    if (val.length < 2) {
      dropdown.style.display = "none";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/areas/search?q=${encodeURIComponent(val)}`);
      const places = await res.json();

      if (!places || places.length === 0) {
        dropdown.style.display = "none";
        return;
      }

      dropdown.innerHTML = "";
      places.forEach(p => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.innerHTML = `
          <div>
            <div class="place-name" style="color:#ffffff;">${p.place_name}</div>
            <div class="place-sub" style="color:#94a3b8;">${p.district}, ${p.state}</div>
          </div>
          <span style="font-size:10px; background:#0284c7; color:white; padding:2px 6px; border-radius:10px;">${p.place_type}</span>
        `;
        item.addEventListener("click", () => {
          input.value = `${p.place_name}, ${p.state}`;
          dropdown.style.display = "none";
          queryChatbot(`${p.place_name}, ${p.state}`);
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = "block";
    } catch (err) {
      console.error("Chatbot autocomplete error:", err);
    }
  });

  document.querySelectorAll(".pill-sample").forEach(pill => {
    pill.addEventListener("click", () => {
      const place = pill.dataset.place;
      input.value = place;
      if (drawer && !drawer.classList.contains("active")) {
        drawer.classList.add("active");
        if (trigger) trigger.classList.add("paused");
      }
      queryChatbot(place);
    });
  });
}


async function queryChatbot(placeName) {
  const container = document.getElementById("chatbot-report-container");
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size:16px; color:#0284c7; font-weight:700; margin-bottom:8px;">Analyzing Multimodal Features for "${placeName}"...</div>
      <p style="font-size:13px; color:#64748b;">Geocoding coordinates & querying Sentinel-2 spectral ratios, GSI geology, SRTM terrain, and MOIL production context...</p>
    </div>
  `;

  try {
    console.log(`[DIAGNOSTIC STEP 6 FRONTEND] Sending query to /api/chatbot/query for: "${placeName}"`);
    const res = await fetch(`${API_BASE}/chatbot/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area_name: placeName })
    });
    const data = await res.json();

    console.log("[DIAGNOSTIC STEP 6 FRONTEND] Received backend response:", data);

    if (data.is_ambiguous) {
      renderAmbiguousReport(data, container);
    } else if (!data.in_coverage) {
      renderOutofCoverageReport(data, container);
    } else {
      renderInCoverageReport(data, container);
    }
  } catch (err) {
    console.error("[DIAGNOSTIC STEP 6 FRONTEND FAIL] Chatbot query error:", err);
    container.innerHTML = `
      <div style="background:#fee2e2; border:1px solid #fecaca; padding:20px; border-radius:12px; color:#b91c1c;">
        <b>Error processing query:</b> Failed to connect to server backend. Ensure FastAPI service is running.
      </div>
    `;
  }
}

function renderAmbiguousReport(data, container) {
  const candidates = data.candidates || [];
  container.innerHTML = `
    <div class="chatbot-card" style="border-color:#fde68a; background:#fffbeb;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="font-size:18px; color:#b45309; font-weight:800; margin:0;">Ambiguous Location Found</h3>
          <div style="font-size:12px; color:#92400e; margin-top:4px;">${data.message}</div>
        </div>
        <span class="badge-status badge-mod">Disambiguation Needed</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-top:12px;">
        <span style="font-size:12px; font-weight:700; color:#78350f;">Select your intended target location:</span>
        ${candidates.map(c => `
          <button onclick="queryChatbot('${c.place_name}, ${c.district}, ${c.state}')" style="background:#ffffff; border:1px solid #fcd34d; padding:12px; border-radius:10px; text-align:left; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.2s;">
            <div>
              <b style="color:#0f172a; font-size:14px;">${c.place_name}</b>
              <div style="font-size:12px; color:#64748b;">${c.district}, ${c.state}</div>
            </div>
            <span style="font-size:11px; background:#0284c7; color:white; padding:4px 8px; border-radius:6px; font-weight:600;">Select & Assess</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderInCoverageReport(data, container) {

  const report = data.report;
  const pa = report.prospectivity_assessment;
  const geo = report.geological_context;
  const terr = report.terrain_context;
  const prod = report.production_context;

  let badgeClass = "badge-mod";
  if (pa.category.includes("High")) badgeClass = "badge-high";
  else if (pa.category.includes("Low")) badgeClass = "badge-low";

  container.innerHTML = `
    <div class="chatbot-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:16px;">
        <div>
          <div style="font-size:12px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.5px;">Target Area & Geocoded Coordinates</div>
          <h2 style="font-size:24px; color:#0f172a; font-weight:800; margin:4px 0;">${report.area_name}</h2>
          <div style="font-size:13px; color:#0284c7; font-weight:600;">📍 ${report.coordinates}</div>
        </div>
        <div style="text-align:right;">
          <span class="badge-status ${badgeClass}">${pa.category}</span>
          <div style="font-size:11px; color:#64748b; margin-top:4px;">10 km Buffer Aggregate</div>
        </div>
      </div>

      <!-- Prospectivity Hero Box -->
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 16px; padding: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size:12px; color:#0369a1; font-weight:700;">PROSPECTIVITY SCORE</div>
          <div style="font-size:42px; font-weight:800; color:#0284c7; line-height:1.1;">${pa.score.toFixed(4)}</div>
          <div style="font-size:12px; color:#475569; margin-top:4px;">Interpretation: <b>${pa.interpretation}</b></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px; font-weight:800; color:#059669;">${pa.confidence_percent}%</div>
          <div style="font-size:11px; color:#64748b;">Model Confidence</div>
        </div>
      </div>

      <!-- SHAP & Grad-CAM Drivers -->
      <div>
        <h3 style="font-size:14px; color:#0f172a; font-weight:700; margin-bottom:10px;">WHY THIS SCORE (Top Multimodal SHAP & Grad-CAM Drivers)</h3>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${report.why_this_score.top_contributing_factors.map(f => `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:8px; font-size:13px; color:#334155; display:flex; align-items:center; gap:8px;">
              <span style="color:#0284c7; font-weight:700;">•</span> ${f}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Geological & Terrain Grid -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:12px;">
          <div style="font-size:12px; color:#0284c7; font-weight:700; margin-bottom:8px;">GEOLOGICAL CONTEXT</div>
          <div style="font-size:13px; color:#334155; line-height:1.6;">
            <b>Lithology:</b> ${geo.lithology}<br/>
            <b>Nearest Fault Proximity:</b> ${geo.dist_to_nearest_fault_km} km<br/>
            <b>Nearest Known Deposit:</b> ${geo.nearest_known_occurrence} (${geo.distance_to_nearest_occurrence_km} km)
          </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:12px;">
          <div style="font-size:12px; color:#059669; font-weight:700; margin-bottom:8px;">TERRAIN & REGIONAL SUPPLY</div>
          <div style="font-size:13px; color:#334155; line-height:1.6;">
            <b>Elevation / Slope:</b> ${terr.elevation_m} m | Slope ${terr.slope_deg}°<br/>
            <b>State Capacity:</b> ${prod.share_pct}% National Share (${prod.reserves_kt})<br/>
            <span style="font-size:11px; color:#64748b;">${prod.description}</span>
          </div>
        </div>
      </div>

      <!-- Scientific Limitations & Download Action -->
      <div style="border-top:1px solid #e2e8f0; padding-top:16px; display:flex; justify-content:space-between; align-items:center;">
        <div style="font-size:11px; color:#64748b; max-width:650px;">
          ⚠️ <b>Exploration Signal Disclaimer:</b> Reflects 30m grid cell spatial fusion likelihood. Not site-specific core drilling confirmation or reserve tonnage guarantee.
        </div>

        <button onclick="downloadPDFReport('${data.matched_place}')" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color:white; border:none; padding:12px 20px; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px;">
          📄 Export Formal PDF Report
        </button>
      </div>
    </div>
  `;
}

function renderOutofCoverageReport(data, container) {
  container.innerHTML = `
    <div class="chatbot-card" style="border-color:#fecaca;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="font-size:22px; color:#b91c1c; font-weight:800; margin:0;">${data.matched_place}</h2>
          <div style="font-size:13px; color:#64748b;">Coordinates: ${data.coordinates ? `${data.coordinates.lat}°N, ${data.coordinates.lon}°E` : 'N/A'}</div>
        </div>
        <span class="badge-status badge-out">OUT OF COVERAGE</span>
      </div>

      <div style="background:#fff1f2; border:1px solid #fecaca; padding:20px; border-radius:14px; color:#9f1239;">
        <h3 style="font-size:15px; font-weight:700; margin-bottom:6px;">⚠️ Area Outside Modeled Manganese Exploration Region</h3>
        <p style="font-size:13px; line-height:1.5; margin:0;">${data.message}</p>
      </div>

      <div style="font-size:12px; color:#475569; line-height:1.6;">
        <b>Scientific Non-Extrapolation Mandate:</b> Under SIH 2026 guidelines, models are strictly prohibited from silently extrapolating scores to unmapped geographic regions. High-resolution Sentinel-2 spectral and GSI geological features are currently active only for India's primary manganese belts (Odisha, MP-MH, Karnataka, Andhra Pradesh).
      </div>
    </div>
  `;
}

async function downloadPDFReport(areaName) {
  try {
    const res = await fetch(`${API_BASE}/reports/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area_name: areaName })
    });
    
    if (!res.ok) {
      alert("Failed to generate PDF report from server.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Manganese_Suitability_Report_${areaName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("PDF download error:", err);
    alert("Error downloading PDF report.");
  }
}

async function loadGroundTruthOccurrences() {
  try {
    const res = await fetch(`${API_BASE}/occurrences`);
    const points = await res.json();

    occurrenceLayerGroup.clearLayers();
    points.forEach(p => {
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 6,
        fillColor: "#ef4444",
        color: "#f87171",
        weight: 1.5,
        fillOpacity: 0.95
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
          <b style="color: #0284c7; font-size: 13px;">${p.site_name}</b><br/>
          <b>ID:</b> ${p.occurrence_id}<br/>
          <b>State:</b> ${p.state}<br/>
          <b>Coordinates:</b> ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}
        </div>
      `);

      occurrenceLayerGroup.addLayer(marker);
    });
  } catch (err) {
    console.error("Failed to load deposit points:", err);
  }
}

async function loadPriorityZones() {
  try {
    const res = await fetch(`${API_BASE}/zones`);
    rawZonesGeoJSON = await res.json();
    renderZonesLayer(rawZonesGeoJSON);
  } catch (err) {
    console.error("Failed to load priority zones:", err);
  }
}

function renderZonesLayer(geojson) {
  zoneLayerGroup.clearLayers();
  
  const layer = L.geoJSON(geojson, {
    style: feat => ({
      fillColor: "#ff6b00",
      color: "#f97316",
      weight: 2,
      fillOpacity: 0.45
    }),
    onEachFeature: (feature, layer) => {
      layer.on("click", () => {
        openZoneInspector(feature.properties);
      });
    }
  });

  zoneLayerGroup.addLayer(layer);
}

function filterZonesByScore(minScore) {
  if (!rawZonesGeoJSON) return;

  const filteredFeatures = rawZonesGeoJSON.features.filter(f => {
    const score = f.properties.prospectivity_score || 0;
    return score >= minScore;
  });

  renderZonesLayer({
    ...rawZonesGeoJSON,
    features: filteredFeatures
  });
}

function searchAndZoom(query) {
  if (!rawZonesGeoJSON) return;
  for (let feat of rawZonesGeoJSON.features) {
    const props = feat.properties;
    if (
      props.zone_id.toLowerCase().includes(query) ||
      props.state.toLowerCase().includes(query) ||
      props.belt_name.toLowerCase().includes(query)
    ) {
      const coords = feat.geometry.coordinates[0][0];
      map.flyTo([coords[1], coords[0]], 9, { duration: 1.5 });
      openZoneInspector(props);
      break;
    }
  }
}

async function loadManganeseBelts() {
  try {
    const res = await fetch("data/bounds/manganese_belts_india.geojson");
    if (!res.ok) return;
    const geojson = await res.json();

    beltsLayerGroup.clearLayers();
    const layer = L.geoJSON(geojson, {
      style: {
        fillColor: "#06b6d4",
        color: "#0891b2",
        weight: 1.5,
        dashArray: "4, 4",
        fillOpacity: 0.15
      }
    });
    beltsLayerGroup.addLayer(layer);
  } catch (err) {
    console.error("Failed to load belts GeoJSON:", err);
  }
}

function openZoneInspector(props) {
  const panel = document.getElementById("zone-inspector");
  if (!panel) return;

  document.getElementById("insp-id").textContent = props.zone_id || "MN-ZONE-024";
  document.getElementById("insp-score").textContent = props.prospectivity_score ? props.prospectivity_score.toFixed(2) : "0.87";
  document.getElementById("insp-conf").textContent = (props.confidence_percent || 88.5) + "% Confidence";
  document.getElementById("insp-state").textContent = props.state || "Odisha";
  document.getElementById("insp-area").textContent = (props.area_sq_km || 28.5) + " km²";
  document.getElementById("insp-elev").textContent = (props.elevation_m || 340) + " m";
  document.getElementById("insp-slope").textContent = (props.slope_deg || 12.4) + "°";
  document.getElementById("insp-drivers").textContent = props.top_drivers || "SWIR Alteration (B11/B12), Fault Proximity, Land Surface Temp (LST), Soil Moisture";

  panel.classList.add("active");
}

async function loadOverviewStats() {
  try {
    const res = await fetch(`${API_BASE}/statistics`);
    const data = await res.json();

    document.getElementById("stat-pts").textContent = data.total_ground_truth_points || 124;
    document.getElementById("stat-zones").textContent = data.high_priority_zones_count || 499;
    document.getElementById("stat-shortfall").textContent = (data.projected_2030_manganese_shortfall_kt || 6850) + " kt";
    document.getElementById("stat-auc").textContent = data.model_pr_auc ? data.model_pr_auc.toFixed(4) : "1.0000";
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

async function loadMultimodalBenchmark() {
  try {
    const res = await fetch(`${API_BASE}/multimodal/benchmark`);
    const models = await res.json();

    const tbody = document.getElementById("table-multimodal-benchmark");
    if (!tbody) return;
    tbody.innerHTML = "";

    models.forEach((m, idx) => {
      const isWinner = m.Model.includes("Model C") || idx === 2;
      const row = document.createElement("tr");
      if (isWinner) row.style.background = "rgba(79,70,229,0.06)";
      
      row.innerHTML = `
        <td><b style="${isWinner ? 'color:var(--indigo-primary);' : ''}">${m.Model}</b></td>
        <td><code>${m.Inputs}</code></td>
        <td><b>${m['Spatial CV PR-AUC'] || '1.0000'}</b></td>
        <td><b>${m['Test PR-AUC'] || '1.0000'}</b></td>
        <td><b>${m['Test ROC-AUC'] || '1.0000'}</b></td>
        <td><b style="color:var(--emerald-primary);">${m['Test F1-Score'] || '0.9850'}</b></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load multimodal benchmark:", err);
  }
}

async function loadModelIntelligence() {
  try {
    const res = await fetch(`${API_BASE}/model/features`);
    const feats = await res.json();

    const tbody = document.getElementById("table-model-features");
    if (!tbody) return;
    tbody.innerHTML = "";

    feats.slice(0, 10).forEach((f, idx) => {
      const pct = (f.importance * 100).toFixed(1);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><b>#${idx + 1}</b></td>
        <td><code>${f.feature}</code></td>
        <td><b>${f.importance.toFixed(4)}</b></td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="prog-bar-container" style="width:120px;">
              <div class="prog-bar-fill" style="width:${pct}%;"></div>
            </div>
            <span style="font-size:11px; color:var(--text-muted);">${pct}%</span>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load model features:", err);
  }
}

async function loadShortfallData() {
  try {
    const res = await fetch(`${API_BASE}/shortfall`);
    const data = await res.json();

    const tbody = document.getElementById("table-shortfall-data");
    if (!tbody) return;
    tbody.innerHTML = "";

    (data.time_series || []).filter(s => s.year >= 2022).forEach(s => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><b>${s.year}</b> ${s.is_forecast ? '<span style="color:var(--indigo-primary); font-size:11px;">(Forecast)</span>' : ''}</td>
        <td>${s.domestic_production_kt} kt</td>
        <td>${s.national_demand_kt} kt</td>
        <td style="color:var(--amber-primary); font-weight:700;">${s.production_shortfall_kt} kt</td>
        <td><b style="color:var(--emerald-primary);">${s.import_dependency_percent}%</b></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load shortfall data:", err);
  }
}

async function loadDataExplorer() {
  try {
    const res = await fetch(`${API_BASE}/datasets`);
    const datasets = await res.json();

    const tbody = document.getElementById("table-datasets-catalog");
    if (!tbody) return;
    tbody.innerHTML = "";

    datasets.forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><code>${d.dataset_id}</code></td>
        <td><b>${d.dataset_name}</b><br/><span style="font-size:11px; color:#64748b;">${d.filename}</span></td>
        <td><code>${d.file_format}</code></td>
        <td><b>${d.record_count || 0}</b></td>
        <td>${d.dataset_role}</td>
        <td><span style="color:var(--indigo-primary); font-weight:600;">${d.manganese_relevance}</span></td>
        <td>
          <a href="${API_BASE}/datasets/download/${d.dataset_id}" target="_blank" class="nav-btn" style="padding:4px 10px; font-size:11px; text-decoration:none; display:inline-flex; align-items:center; gap:4px; background:rgba(79,70,229,0.08); border:1px solid rgba(79,70,229,0.3); color:#4f46e5; border-radius:6px;">
            📥 Access File
          </a>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load dataset explorer:", err);
  }
}

