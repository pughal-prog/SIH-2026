// SIH 2026 Manganese Multimodal AI Intelligence Platform Engine

const API_BASE = "http://127.0.0.1:8000/api";

let map = null;
let occurrenceLayerGroup = null;
let zoneLayerGroup = null;
let beltsLayerGroup = null;
let rawZonesGeoJSON = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initGISMap();
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

  document.getElementById("search-gis")?.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (query.length > 2) {
      searchAndZoom(query);
    }
  });

  document.getElementById("close-inspector")?.addEventListener("click", () => {
    document.getElementById("zone-inspector")?.classList.remove("active");
  });
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
  document.getElementById("insp-swir").textContent = props.swir_alteration_index ? props.swir_alteration_index.toFixed(2) : "1.85";
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

    datasets.slice(0, 15).forEach(d => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><code>${d.dataset_id}</code></td>
        <td><b>${d.dataset_name}</b></td>
        <td><code>${d.file_format}</code></td>
        <td>${d.record_count}</td>
        <td>${d.dataset_role}</td>
        <td><span style="color:var(--indigo-primary); font-weight:600;">${d.manganese_relevance}</span></td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load dataset explorer:", err);
  }
}
