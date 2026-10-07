 (() => {
  // Requests use this frontend origin; server.js proxies /api to the backend.
  const API_BASE_URL = '';
  const API = {
    lands: () => `${API_BASE_URL}/api/lands`,
    land: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}`,
    risk: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/risk`,
    documents: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/documents`,
    analysis: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/ai-analysis`,
    location: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/location`,
    whatIf: (id, scenario = {}) => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/what-if${Object.keys(scenario).length ? `?${new URLSearchParams(scenario)}` : ''}`,
    report: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/report`
  };

  const $ = id => document.getElementById(id);
  const state = { land: null, risk: null, documents: null, analysis: null, location: null, report: null, score: null, landId: null, loadToken: 0, map: null, mapLayers: null };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pick = (obj, paths, fallback = undefined) => {
    for (const path of paths) {
      const value = path.split('.').reduce((part, key) => part == null ? undefined : part[key], obj);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };
  const asArray = value => Array.isArray(value) ? value : value && typeof value === 'object' ? Object.values(value) : [];
  const numeric = value => { const number = Number(String(value ?? '').replace(/[^\d.-]/g, '')); return Number.isFinite(number) ? number : null; };
  const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
  const titleCase = value => String(value ?? '').replace(/[_-]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  async function request(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }
  function unwrap(data, keys) {
    for (const key of keys) if (data && data[key] !== undefined) return data[key];
    return data;
  }
  function toast(message) {
    const el = $('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3000);
  }
  $('todayDate').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' }).format(new Date()).toUpperCase();
  function fail(message) {
    $('riskScore').innerHTML = '—<small>/100</small>';
    $('riskScoreSmall').innerHTML = '—<small>/100</small>';
    $('scoreMeter').style.width = '0%';
    $('documentCount').innerHTML = '—<small> docs</small>';
    $('disputeCount').innerHTML = '—<small> reported</small>';
    $('riskSummary').textContent = message;
    $('documentSummary').textContent = 'Could not load document status';
    $('disputeSummary').textContent = 'Could not load dispute status';
    $('aiAnalysis').innerHTML = `<span class="error-text">${escapeHtml(message)}. Check that the backend is running and allows this page’s origin.</span>`;
    $('riskCategories').innerHTML = '<div class="loading-row error-text">Risk data unavailable. Retry when the API is reachable.</div>';
    $('documentsList').innerHTML = '<div class="loading-row error-text">Document data unavailable.</div>';
    $('mapLoading').textContent = 'Location data unavailable. Retry when the API is reachable.';
    $('mapAccuracy').innerHTML = '<i></i> LOCATION UNAVAILABLE';
    $('reportContent').innerHTML = `<p class="error-text">${escapeHtml(message)}. Consolidated report unavailable.</p>`;
    $('screeningResult').textContent = 'UNAVAILABLE';
    $('screeningNote').textContent = 'Screening requires a response from the risk API.';
    $('verifiedChip').textContent = 'API ERROR';
    $('disputeAlert').innerHTML = '<span class="alert-symbol">!</span><div><b>Risk screening unavailable</b><p>Connect to the backend to see active dispute status.</p></div><span class="alert-state">API ERROR</span>';
  }

  async function loadLands() {
    const data = await request(API.lands());
    const lands = asArray(unwrap(data, ['lands', 'data', 'results']));
    const select = $('landSelect');
    if (!lands.length) throw new Error('The lands endpoint returned no parcels');
    select.innerHTML = lands.map((land, index) => {
      const id = first(land.id, land.land_id, land.parcel_id, land.code, land.slug, typeof land === 'string' ? land : null, index === 0 ? 'DEMO-001' : null);
      const name = first(land.name, land.title, land.location, land.address, land.owner_name, id);
      return `<option value="${escapeHtml(id)}">${escapeHtml(name)} · ${escapeHtml(id)}</option>`;
    }).join('');
    return select.value;
  }

  async function loadLand(id) {
    const token = ++state.loadToken;
    $('simulationResult').innerHTML = '<span class="result-spark">✳</span><div><b>Choose a scenario to calculate its risk score</b><p>Results load from the backend What-If API.</p></div>';
    const results = await Promise.allSettled([request(API.land(id)), request(API.risk(id)), request(API.documents(id)), request(API.analysis(id)), request(API.location(id)), request(API.report(id))]);
    if (token !== state.loadToken) return;
    const errors = results.filter(result => result.status === 'rejected');
    state.land = results[0].status === 'fulfilled' ? unwrap(results[0].value, ['land', 'data']) : null;
    state.risk = results[1].status === 'fulfilled' ? unwrap(results[1].value, ['risk', 'data']) : null;
    state.documents = results[2].status === 'fulfilled' ? unwrap(results[2].value, ['documents', 'verification', 'data']) : null;
    state.analysis = results[3].status === 'fulfilled' ? unwrap(results[3].value, ['analysis', 'result', 'data']) : null;
    state.location = results[4].status === 'fulfilled' ? unwrap(results[4].value, ['location_data', 'data']) : null;
    state.report = results[5].status === 'fulfilled' ? unwrap(results[5].value, ['report', 'data']) : null;
    state.landId = id;
    if (errors.length && !state.land && !state.risk && !state.documents && !state.analysis && !state.location && !state.report) {
      const error = errors[0].reason; throw new Error(error.message || 'The API could not be reached');
    }
    renderLand(id); renderRisk(); renderDocuments(); renderAnalysis();
    renderReport();
    if (errors.length) toast(`${errors.length} endpoint${errors.length > 1 ? 's' : ''} could not be loaded; available data is shown.`);
  }

  function renderLand(id) {
    const land = state.land || {};
    const locationData = state.location || {};
    const location = locationData.location || {};
    $('parcelId').textContent = first(land.parcel_id, land.land_id, land.id, id);
    $('mapParcelId').textContent = first(land.parcel_id, land.land_id, land.id, id);
    $('landLocation').textContent = first([location.mouza || land.mouza, location.upazila || land.upazila, location.district || land.district].filter(Boolean).join(', '), land.location, land.address, land.area_name, land.district, 'Location not supplied by API');
    $('landMeta').textContent = [land.owner_name ? `Owner: ${land.owner_name}` : null, land.khatian_no ? `Khatian ${land.khatian_no}` : null, land.dag_no ? `Dag ${land.dag_no}` : null, location.accuracy].filter(Boolean).join(' · ') || 'Land parcel details from registry';
    const size = first(land.land_size, land.area, land.land_area, land.size);
    const unit = first(land.area_unit, land.land_size_unit, land.unit);
    $('landArea').textContent = size === undefined ? 'Not provided' : `${size}${unit ? ` ${unit}` : ' (unit not provided)'}`;
    $('landType').textContent = titleCase(first(land.land_type, land.type, land.category, 'Not provided'));
    $('boundaryStatus').textContent = titleCase(first(locationData.boundary_accuracy, land.boundary_status, land.boundary, land.survey_status, 'Not provided'));
    const elevation = locationData.terrain?.elevation_range_m;
    $('elevationValue').textContent = elevation ? `${elevation.min}–${elevation.max} m` : first(land.elevation ? `${land.elevation} m` : null, land.elevation_meters ? `${land.elevation_meters} m` : null, 'Not provided');
    $('terrainAccuracy').textContent = first(locationData.terrain?.source, location.accuracy, 'DEMO / APPROXIMATE');
    $('terrainType').textContent = first(locationData.terrain?.surface_type, 'Terrain data unavailable');
    $('terrainNote').textContent = first(locationData.terrain_note, 'Demo visualization only; not surveyed elevation data.');
    renderMap(land, locationData);
  }

  function renderMap(land, locationData) {
    const location = locationData.location || {};
    const latitude = Number(location.latitude), longitude = Number(location.longitude);
    const hasCoordinates = location.latitude !== null && location.latitude !== undefined && location.longitude !== null && location.longitude !== undefined && Number.isFinite(latitude) && Number.isFinite(longitude);
    const geometry = locationData.boundary_geojson || land.boundary_geojson || land.geojson || land.geometry;
    const note = first(locationData.boundary_note, locationData.map_note, 'Coordinates and boundary are approximate demo data.');
    $('mapAccuracy').innerHTML = `<i></i> ${escapeHtml(first(location.accuracy, 'LOCATION STATUS UNKNOWN'))} · ${escapeHtml(first(locationData.boundary_accuracy, location.accuracy, 'BOUNDARY UNVERIFIED'))}`;
    $('mapLoading').textContent = note;
    if (!window.L || !hasCoordinates) {
      $('realMap').style.display = 'none';
      $('mapFallback').style.display = 'block';
      $('mapLoading').textContent = !hasCoordinates ? 'No coordinates returned. Showing an illustrative preview.' : 'Map library unavailable. Showing an illustrative preview.';
      return;
    }
    $('mapFallback').style.display = 'none';
    $('realMap').style.display = 'block';
    if (!state.map) {
      state.map = L.map('realMap', { zoomControl: false, scrollWheelZoom: true });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(state.map);
      state.mapLayers = L.featureGroup().addTo(state.map);
    }
    state.mapLayers.clearLayers();
    L.marker([latitude, longitude]).bindPopup(`${escapeHtml($('parcelId').textContent)} · ${escapeHtml(first(location.accuracy, 'Unverified coordinates'))}`).addTo(state.mapLayers);
    if (geometry) {
      try {
        const boundary = L.geoJSON(geometry, { style: { color: '#28784d', weight: 3, fillColor: '#68a977', fillOpacity: 0.25, dashArray: '6 4' } });
        boundary.addTo(state.mapLayers);
      } catch { toast('Boundary data could not be rendered; showing coordinates only.'); }
    }
    const bounds = state.mapLayers.getBounds();
    if (bounds.isValid()) state.map.fitBounds(bounds.pad(0.5), { maxZoom: 18 });
    else state.map.setView([latitude, longitude], 17);
    setTimeout(() => state.map.invalidateSize(), 0);
  }

  function renderRisk() {
    const risk = state.risk || {};
    const score = numeric(first(risk.score, risk.risk_score, risk.overall_score, risk.total_score, risk.risk?.score));
    state.score = score;
    const level = String(first(risk.level, risk.risk_level, risk.rating, risk.risk?.level, score === null ? 'Unavailable' : score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW')).toUpperCase();
    $('riskScore').innerHTML = `${score === null ? '—' : escapeHtml(score)}<small>/100</small>`;
    $('riskScoreSmall').innerHTML = `${score === null ? '—' : escapeHtml(score)}<small>/100</small>`;
    $('riskLevel').textContent = level;
    $('riskLevel').className = `risk-badge ${level.toLowerCase()}`;
    $('scoreMeter').style.width = `${score === null ? 0 : Math.max(0, Math.min(100, score))}%`;
    $('riskSummary').textContent = first(risk.summary, risk.description, `${level} risk based on the latest risk engine assessment.`, 'Risk details unavailable');
    const rawCategories = first(risk.categories, risk.factors, risk.breakdown, risk.risk_categories, []);
    const categories = Array.isArray(rawCategories) ? rawCategories : Object.entries(rawCategories || {}).map(([name, value]) => ({ name, ...value }));
    $('riskCategories').innerHTML = categories.length ? categories.slice(0, 10).map((category, index) => {
      const name = typeof category === 'string' ? category : first(category.name, category.category, category.title, `Risk factor ${index + 1}`);
      const rawScore = numeric(first(category.score, category.risk_score, category.value, category.rating));
      const percent = rawScore === null ? 0 : Math.max(0, Math.min(100, rawScore));
      const description = typeof category === 'string' ? 'Assessment from risk engine' : first(category.explanation, category.description, category.status, category.details, 'Assessment from risk engine');
      const color = percent >= 70 ? '#cf7a60' : percent >= 40 ? '#d5a25c' : '#75a675';
      return `<article class="risk-category"><div class="risk-cat-heading"><b>${escapeHtml(titleCase(name))}</b><span style="color:${color}">${rawScore === null ? escapeHtml(titleCase(first(category.status, 'ASSESSED'))) : `${escapeHtml(rawScore)}/100`}</span></div><div class="risk-track"><span style="width:${percent}%;background:${color}"></span></div><p title="${escapeHtml(description)}">${escapeHtml(description)}</p></article>`;
    }).join('') : '<div class="loading-row">Risk categories are not included in this API response.</div>';
    const disputeCategory = first(risk.categories?.dispute, risk.dispute, {});
    const disputeStatus = String(first(disputeCategory.status, '')).toLowerCase();
    const disputes = first(risk.active_disputes, risk.disputes, risk.dispute_count, risk.dispute?.count, risk.flags?.active_disputes);
    const disputeCount = Array.isArray(disputes) ? disputes.length : numeric(disputes);
    const hasDispute = disputeCount !== null ? disputeCount > 0 : Boolean(first(risk.has_active_dispute, risk.active_dispute, risk.dispute?.active, ['yes', 'active', 'disputed', 'pending'].includes(disputeStatus), false));
    $('disputeCount').innerHTML = `${disputeCount === null ? (hasDispute ? 'Active' : '—') : disputeCount}<small> ${disputeCount === 1 ? 'reported' : 'reported'}</small>`;
    $('disputeSummary').textContent = hasDispute ? 'Requires resolution before proceeding' : disputeCount === 0 ? 'No active dispute reported' : 'Status not available';
    const screening = first(risk.final_screening_result, risk.screening_result, risk.final_result, risk.recommendation, risk.screening?.result);
    const screeningText = String(screening || (hasDispute ? 'HIGH RISK - DO NOT PROCEED UNTIL VERIFIED' : `${level} RISK`));
    $('screeningResult').textContent = screeningText;
    $('screeningResult').title = screeningText;
    $('screeningNote').textContent = first(risk.screening_reason, risk.final_screening_reason, hasDispute ? 'Active dispute requires verification before any commitment.' : 'Based on the current risk engine assessment.');
    $('disputeAlert').innerHTML = hasDispute
      ? `<span class="alert-symbol">!</span><div><b>${escapeHtml(first(risk.dispute_title, 'Active dispute detected'))}</b><p>${escapeHtml(first(risk.dispute_summary, risk.dispute_details, 'Resolve and verify the dispute before proceeding.'))}</p></div><span class="alert-state">ACTION NEEDED</span>`
      : `<span class="alert-symbol">✓</span><div><b>${disputeCount === 0 ? 'No active dispute reported' : 'Dispute status not provided'}</b><p>${escapeHtml(first(risk.dispute_summary, 'See the risk engine response for the latest status.'))}</p></div><span class="alert-state">${disputeCount === 0 ? 'CLEAR' : 'UNKNOWN'}</span>`;
    if (hasDispute) $('screeningResult').classList.add('high-risk');
  }

  function renderDocuments() {
    const response = state.documents || {};
    const checks = response.checks && typeof response.checks === 'object' ? Object.entries(response.checks).map(([name, check]) => ({ name, ...check })) : [];
    const list = asArray(first(response.documents, response.items, response.records, response.verified_documents, checks.length ? checks : null, Array.isArray(response) ? response : []));
    const summary = first(response.summary, response.message, response.status_message, response.verification_status);
    const verifiedCount = numeric(first(response.verified_count, response.documents_verified, response.verified, response.summary?.verified_count, checks.filter(check => /pass|verified/i.test(String(check.status))).length || null));
    $('documentCount').innerHTML = `${verifiedCount === null ? (list.length || '—') : verifiedCount}<small> docs</small>`;
    $('documentSummary').textContent = first(summary, verifiedCount !== null ? `${verifiedCount} document${verifiedCount === 1 ? '' : 's'} verified by the backend` : list.length ? `${list.length} records returned by verification API` : 'Verification summary not provided');
    const statusCount = list.filter(doc => /verified|valid|pass|authentic/i.test(String(first(doc.status, doc.verification_status, doc.result, '')))).length;
    $('verifiedChip').textContent = list.length ? `${statusCount} PASSED` : titleCase(first(response.status, 'NO RECORDS'));
    $('documentsList').innerHTML = list.length ? list.slice(0, 4).map((doc, index) => {
      const name = typeof doc === 'string' ? doc : first(doc.name, doc.document_name, doc.title, doc.type, `Document ${index + 1}`);
      const status = typeof doc === 'string' ? '' : String(first(doc.status, doc.verification_status, doc.result, 'Not checked'));
      const details = typeof doc === 'string' ? 'Verification record' : first(doc.message, doc.owner, doc.issued_by, doc.details, doc.reference, doc.date, 'Verification record');
      const valid = /verified|valid|pass/i.test(status);
      return `<div class="document-row"><div class="document-icon">▤</div><div><b>${escapeHtml(titleCase(name))}</b><small>${escapeHtml(details)}</small></div><span class="doc-status ${valid ? '' : 'warn'}">${escapeHtml(titleCase(status || 'RECORDED'))}</span></div>`;
    }).join('') : `<div class="loading-row">${escapeHtml(first(response.message, 'No document records returned by the verification API.'))}</div>`;
  }

  function renderAnalysis() {
    const analysis = state.analysis || {};
    const paragraphs = first(analysis.analysis, analysis.summary, analysis.assessment, analysis.risk_analysis, analysis.narrative, analysis.explanation);
    const recommendation = first(analysis.recommendation, analysis.recommended_action, analysis.recommended_actions, analysis.next_steps, analysis.action);
    const text = Array.isArray(paragraphs) ? paragraphs.join(' ') : paragraphs;
    const risks = asArray(analysis.key_risks);
    const method = first(analysis.analysis_type, 'LAND RISK ANALYSIS');
    $('analysisMethod').textContent = String(method).replace(/[_-]+/g, ' ').toUpperCase();
    const disclaimer = first(analysis.disclaimer, 'Screening result only; confirm details with official land records.');
    $('aiAnalysis').innerHTML = `${text ? `<p>${escapeHtml(text)}</p>${risks.length ? `<p><strong>Key risks:</strong> ${escapeHtml(risks.join(' · '))}</p>` : ''}` : '<p>Analysis text was not included in the API response.</p>'}<p class="analysis-disclaimer">${escapeHtml(disclaimer)}</p>`;
    $('recommendation').innerHTML = `<span>✦</span><div><b>System recommendation</b><p>${escapeHtml(Array.isArray(recommendation) ? recommendation.join(' · ') : first(recommendation, 'No recommendation was returned by the analysis API.'))}</p></div>`;
  }

  function renderReport() {
    const report = state.report;
    if (!report) {
      $('reportContent').innerHTML = '<p class="loading-row">The report endpoint is unavailable. Refresh after the backend is updated.</p>';
      return;
    }
    const land = report.land_information || {};
    const risk = report.risk || {};
    const categories = risk.categories && typeof risk.categories === 'object' ? Object.entries(risk.categories) : [];
    const docs = report.document_verification || {};
    const checks = docs.checks && typeof docs.checks === 'object' ? Object.entries(docs.checks) : [];
    const analysis = report.ai_analysis || {};
    const scenarios = asArray(report.what_if?.examples);
    const recommendation = report.final_recommendation || {};
    const location = report.location || state.location?.location || {};
    const terrain = state.location?.terrain || {};
    const infoRows = [
      ['Owner', land.owner_name], ['Location', [land.mouza, land.upazila, land.district].filter(Boolean).join(', ')],
      ['Khatian', land.khatian_no], ['Dag', land.dag_no], ['Land area', land.land_size === null || land.land_size === undefined ? null : `${land.land_size} (unit not provided)`],
      ['Mutation', land.mutation_status], ['Dispute', land.dispute_status],
      ['Acquisition', land.acquisition_status], ['Khas status', land.khas_status]
    ].filter(([, value]) => value !== null && value !== undefined && value !== '');
    $('reportContent').innerHTML = `
      <div class="report-summary"><div><span>LAND ID</span><b>${escapeHtml(first(report.public_land_id, report.land_id, '—'))}</b></div><div><span>RISK SCORE</span><b>${escapeHtml(risk.overall_score ?? '—')}/100 · ${escapeHtml(first(risk.risk_level, '—'))}</b></div><div><span>SCREENING</span><b>${escapeHtml(first(recommendation.decision, risk.screening_result, '—'))}</b></div></div>
      <div class="report-columns">
        <section><h3>Land information</h3><dl class="report-fields">${infoRows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(titleCase(value))}</dd></div>`).join('') || '<p>Land information unavailable.</p>'}</dl><p class="report-small">Coordinates: ${escapeHtml(location.latitude ?? '—')}, ${escapeHtml(location.longitude ?? '—')} · ${escapeHtml(first(location.accuracy, 'Unverified'))}</p><p class="report-small">Boundary: ${escapeHtml(first(state.location?.boundary_accuracy, 'Not provided'))} · ${escapeHtml(first(state.location?.boundary_note, report.map_note, 'Boundary not verified.'))}</p><p class="report-small">Terrain: ${escapeHtml(first(terrain.surface_type, 'Not provided'))} · ${escapeHtml(terrain.elevation_range_m ? `${terrain.elevation_range_m.min}–${terrain.elevation_range_m.max} m` : 'Elevation not provided')} · ${escapeHtml(first(terrain.source, state.location?.terrain_note, 'Unverified'))}</p></section>
        <section><h3>Risk categories</h3>${categories.map(([name, value]) => `<div class="report-risk"><span>${escapeHtml(titleCase(name))}</span><b>${escapeHtml(value.score)}/100 · ${escapeHtml(value.status)}</b></div>`).join('') || '<p>Risk categories unavailable.</p>'}</section>
        <section><h3>Document screening · ${escapeHtml(first(docs.verification_status, 'UNAVAILABLE'))}</h3>${checks.map(([name, value]) => `<div class="report-risk"><span>${escapeHtml(first(value.document_name, titleCase(name)))}</span><b>${escapeHtml(value.status)}</b><small>${escapeHtml([first(value.details, value.message, ''), value.source ? `Source: ${value.source}` : '', value.verification_type || ''].filter(Boolean).join(' · '))}</small></div>`).join('') || '<p>Document checks unavailable.</p>'}<p class="report-small">${escapeHtml(first(docs.message, 'Screening only. Confirm document authenticity with official records.'))}</p></section>
        <section><h3>Analysis & recommendation</h3><p>${escapeHtml(first(analysis.summary, 'Analysis unavailable.'))}</p><p><b>${escapeHtml(first(recommendation.reason, analysis.recommendation, ''))}</b></p><ul>${asArray(first(recommendation.priority_actions, analysis.recommended_actions, [])).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><h3>What-if scenarios</h3>${scenarios.map(item => `<div class="report-risk"><span>${escapeHtml(item.scenario)}</span><b>${escapeHtml(item.overall_score)}/100 · ${escapeHtml(item.risk_level)}</b></div>`).join('') || '<p>Scenario results unavailable.</p>'}<p class="report-small">${escapeHtml(first(report.what_if?.description, 'Hypothetical scenarios only.'))}</p></section>
      </div><p class="report-disclaimer">${escapeHtml(first(report.disclaimer, analysis.disclaimer, 'Decision-support screening only. Verify with official sources.'))}</p>`;
  }

  async function simulateSelectedScenario() {
    const id = state.landId;
    if (!id) return toast('Select a land parcel first.');
    const selection = $('simulationStep').value;
    const scenarios = {
      current: {},
      dispute: { dispute: 'resolved' },
      mutation: { mutation: 'complete' },
      both: { dispute: 'resolved', mutation: 'complete' }
    };
    const button = $('simulateButton');
    button.disabled = true;
    button.querySelector('span').textContent = '…';
    try {
      const result = await request(API.whatIf(id, scenarios[selection]));
      const current = result.current || {};
      const simulated = result.simulated || {};
      const delta = Number(simulated.overall_score) - Number(current.overall_score);
      const changeText = !Number.isFinite(delta) ? 'score comparison unavailable' : delta < 0 ? `${Math.abs(delta)} points lower` : delta > 0 ? `${delta} points higher` : 'no score change';
      $('simulationResult').classList.add('active');
      $('simulationResult').innerHTML = `<span class="result-spark">✳</span><div class="simulation-copy"><b>${escapeHtml(first(result.explanation, 'Hypothetical result from the risk engine.'))}</b><div class="simulation-scores"><span>Current <strong>${escapeHtml(current.overall_score ?? '—')}/100</strong></span><span>Scenario <strong>${escapeHtml(simulated.overall_score ?? '—')}/100</strong></span><span class="scenario-delta">${escapeHtml(changeText)}</span></div><p>${escapeHtml(asArray(result.changes).join(' '))} This scenario is hypothetical; stored land records are unchanged.</p></div>`;
    } catch (error) {
      $('simulationResult').classList.add('active');
      $('simulationResult').innerHTML = `<span class="result-spark">!</span><div><b>Simulator API unavailable</b><p>${escapeHtml(error.message)}. Check the What-If endpoint and try again.</p></div>`;
    } finally {
      button.disabled = false;
      button.querySelector('span').textContent = '→';
    }
  }

  async function refresh() {
    const button = $('refreshButton'); button.disabled = true; button.querySelector('span').textContent = '…';
    try {
      let id = $('landSelect').value;
      if (!$('landSelect').options.length || $('landSelect').options[0].textContent === 'Loading lands…') id = await loadLands();
      await loadLand(id);
    } catch (error) { fail(error.message || 'Unable to load land data'); toast(error.message || 'Unable to connect to the backend'); }
    finally { button.disabled = false; button.querySelector('span').textContent = '↻'; }
  }

  async function refreshReport() {
    if (!state.landId) return toast('Select a land parcel first.');
    $('refreshReport').disabled = true;
    try {
      state.report = await request(API.report(state.landId));
      renderReport();
      toast('Final report updated from backend.');
    } catch (error) {
      $('reportContent').innerHTML = `<p class="error-text">${escapeHtml(error.message)}. Report endpoint unavailable.</p>`;
      toast('Could not refresh the report.');
    } finally { $('refreshReport').disabled = false; }
  }

  function setupTwinControls() {
    const scene = $('twinScene');
    const model = scene.querySelector('.twin-land');
    let rotation = -30, zoom = 1, dragX = null, startRotation = rotation;
    const paint = () => { model.style.transform = `perspective(700px) rotateX(52deg) rotateZ(${rotation}deg) scale(${zoom})`; };
    scene.addEventListener('pointerdown', event => {
      dragX = event.clientX; startRotation = rotation; scene.setPointerCapture(event.pointerId); scene.classList.add('dragging');
    });
    scene.addEventListener('pointermove', event => {
      if (dragX === null) return;
      rotation = startRotation + (event.clientX - dragX) * 0.7; paint();
    });
    const endDrag = () => { dragX = null; scene.classList.remove('dragging'); };
    scene.addEventListener('pointerup', endDrag);
    scene.addEventListener('pointercancel', endDrag);
    scene.addEventListener('wheel', event => {
      event.preventDefault(); zoom = Math.max(0.72, Math.min(1.45, zoom + (event.deltaY < 0 ? 0.06 : -0.06))); paint();
    }, { passive: false });
    scene.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { rotation += event.key === 'ArrowLeft' ? -8 : 8; paint(); event.preventDefault(); }
      if (event.key === '+' || event.key === '=') { zoom = Math.min(1.45, zoom + 0.08); paint(); }
      if (event.key === '-') { zoom = Math.max(0.72, zoom - 0.08); paint(); }
    });
  }

  $('refreshButton').addEventListener('click', refresh);
  $('landSelect').addEventListener('change', event => loadLand(event.target.value).catch(error => { fail(error.message); toast(error.message); }));
  $('simulateButton').addEventListener('click', simulateSelectedScenario);
  $('refreshReport').addEventListener('click', refreshReport);
  $('printReport').addEventListener('click', () => { document.body.classList.add('printing-report'); window.print(); });
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-report'));
  $('mapExpand').addEventListener('click', () => {
    $('mapShell').classList.toggle('expanded');
    $('mapExpand').textContent = $('mapShell').classList.contains('expanded') ? '⛶ Collapse map' : '⛶ Expand map';
    if (state.map) setTimeout(() => state.map.invalidateSize(), 80);
  });
  let zoom = 1; const mapSvg = document.querySelector('.map-svg');
  $('zoomIn').addEventListener('click', () => { if (state.map) state.map.zoomIn(); else { zoom = Math.min(1.65, zoom + .12); mapSvg.style.transform = `scale(${zoom})`; } });
  $('zoomOut').addEventListener('click', () => { if (state.map) state.map.zoomOut(); else { zoom = Math.max(.8, zoom - .12); mapSvg.style.transform = `scale(${zoom})`; } });
  $('locateMap').addEventListener('click', () => {
    const loc = state.location?.location || {};
    if (state.map && Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) state.map.setView([Number(loc.latitude), Number(loc.longitude)], 17);
    else { zoom = 1; mapSvg.style.transform = ''; }
  });
  $('mapDetails').addEventListener('click', () => $('land-details').scrollIntoView({ behavior: 'smooth', block: 'center' }));
  $('allDocuments').addEventListener('click', () => {
    const response = state.documents || {};
    const checks = response.checks && typeof response.checks === 'object'
      ? Object.entries(response.checks).map(([name, value]) => ({ name, ...value })) : [];
    const records = asArray(first(response.documents, response.items, response.records, checks.length ? checks : null, Array.isArray(response) ? response : []));
    $('documentsDialogNote').textContent = first(response.message, response.verification_status, 'No document screening details were returned by the API.');
    $('documentsDialogBody').innerHTML = records.length ? records.map(record => {
      const name = typeof record === 'string' ? record : first(record.name, record.document_name, record.title, record.type, 'Land record check');
      const status = typeof record === 'string' ? 'RECORDED' : first(record.status, record.verification_status, record.result, 'NOT CHECKED');
      const detail = typeof record === 'string' ? 'Record returned by the backend.' : first(record.message, record.details, record.reference, 'No additional detail provided.');
      const good = /pass|verified|valid/i.test(String(status));
      return `<article class="dialog-record"><div><b>${escapeHtml(titleCase(name))}</b><p>${escapeHtml(detail)}</p></div><span class="doc-status ${good ? '' : 'warn'}">${escapeHtml(titleCase(status))}</span></article>`;
    }).join('') : '<p class="loading-row">No document checks are available for this land.</p>';
    const warnings = asArray(response.warnings);
    $('documentsDialogWarning').textContent = warnings.length ? `Follow-up: ${warnings.join(' ')}` : (response.screening_only ? 'Screening only. This does not verify official document authenticity.' : 'Confirm these results against official land records.');
    $('documentsDialog').showModal();
  });
  $('closeDocumentsDialog').addEventListener('click', () => $('documentsDialog').close());
  $('documentsDialog').addEventListener('click', event => { if (event.target === $('documentsDialog')) $('documentsDialog').close(); });
  setupTwinControls();
  refresh();
})();
