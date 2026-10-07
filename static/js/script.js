 (() => {
  // Requests use this frontend origin; server.js proxies /api to the backend.
  const API_BASE_URL = '';
  const API = {
    lands: () => `${API_BASE_URL}/api/lands`,
    land: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}`,
    risk: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/risk`,
    documents: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/documents`,
    analysis: id => `${API_BASE_URL}/api/lands/${encodeURIComponent(id)}/ai-analysis`
  };

  const $ = id => document.getElementById(id);
  const state = { land: null, risk: null, documents: null, analysis: null, score: null, loadToken: 0 };
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
    const results = await Promise.allSettled([request(API.land(id)), request(API.risk(id)), request(API.documents(id)), request(API.analysis(id))]);
    if (token !== state.loadToken) return;
    const errors = results.filter(result => result.status === 'rejected');
    state.land = results[0].status === 'fulfilled' ? unwrap(results[0].value, ['land', 'data']) : null;
    state.risk = results[1].status === 'fulfilled' ? unwrap(results[1].value, ['risk', 'data']) : null;
    state.documents = results[2].status === 'fulfilled' ? unwrap(results[2].value, ['documents', 'verification', 'data']) : null;
    state.analysis = results[3].status === 'fulfilled' ? unwrap(results[3].value, ['analysis', 'result', 'data']) : null;
    if (errors.length && !state.land && !state.risk && !state.documents && !state.analysis) {
      const error = errors[0].reason; throw new Error(error.message || 'The API could not be reached');
    }
    renderLand(id); renderRisk(); renderDocuments(); renderAnalysis();
    if (errors.length) toast(`${errors.length} endpoint${errors.length > 1 ? 's' : ''} could not be loaded; available data is shown.`);
  }

  function renderLand(id) {
    const land = state.land || {};
    $('parcelId').textContent = first(land.parcel_id, land.land_id, land.id, id);
    $('mapParcelId').textContent = first(land.parcel_id, land.land_id, land.id, id);
    $('landLocation').textContent = first(land.location, land.address, [land.mouza, land.upazila, land.district].filter(Boolean).join(', '), land.area_name, land.district, 'Location not supplied by API');
    $('landMeta').textContent = [land.owner_name ? `Owner: ${land.owner_name}` : null, land.khatian_no ? `Khatian ${land.khatian_no}` : null, land.dag_no ? `Dag ${land.dag_no}` : null].filter(Boolean).join(' · ') || 'Land parcel details from registry';
    const size = first(land.land_size, land.area, land.land_area, land.size);
    const unit = first(land.area_unit, land.land_size_unit, land.unit);
    $('landArea').textContent = size === undefined ? 'Not provided' : `${size}${unit ? ` ${unit}` : ' (unit not provided)'}`;
    $('landType').textContent = titleCase(first(land.land_type, land.type, land.category, 'Not provided'));
    $('boundaryStatus').textContent = titleCase(first(land.boundary_status, land.boundary, land.survey_status, 'Not provided'));
    $('elevationValue').textContent = first(land.elevation ? `${land.elevation} m` : null, land.elevation_meters ? `${land.elevation_meters} m` : null, 'Not provided');
    renderMapGeometry(land);
  }

  function renderMapGeometry(land) {
    const svg = document.querySelector('.map-svg');
    svg.querySelectorAll('.dynamic-parcel').forEach(path => path.remove());
    const sampleParcel = svg.querySelector('.parcel');
    sampleParcel.style.display = '';
    let geometry = first(land.boundary_geojson, land.geojson, land.geometry, land.coordinates);
    if (typeof geometry === 'string') {
      try { geometry = JSON.parse(geometry); } catch { geometry = null; }
    }
    if (geometry?.type === 'Feature') geometry = geometry.geometry;
    if (geometry?.geometry) geometry = geometry.geometry;
    let polygons = [];
    if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates)) polygons = [geometry.coordinates];
    else if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) polygons = geometry.coordinates;
    else if (Array.isArray(land.boundary_coordinates)) polygons = [[land.boundary_coordinates]];

    const rings = polygons.flatMap(polygon => polygon).map(ring => ring.map(point => {
      if (Array.isArray(point)) return [Number(point[0]), Number(point[1])];
      if (point && typeof point === 'object') return [Number(first(point.longitude, point.lng, point.lon)), Number(first(point.latitude, point.lat))];
      return [NaN, NaN];
    }).filter(point => point.every(Number.isFinite))).filter(ring => ring.length >= 3);
    const notice = $('mapLoading');
    notice.style.display = 'block';
    if (!rings.length) {
      notice.textContent = 'Illustrative preview — parcel geometry not provided by API.';
      return;
    }

    const points = rings.flat();
    const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX || 1, height = maxY - minY || 1;
    const scale = Math.min(520 / width, 210 / height);
    sampleParcel.style.display = 'none';
    for (const ring of rings) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const pointsOnCanvas = ring.map(([x, y]) => [120 + (x - minX) * scale, 55 + (maxY - y) * scale]);
      path.setAttribute('class', 'parcel dynamic-parcel');
      path.setAttribute('d', pointsOnCanvas.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z');
      svg.appendChild(path);
    }
    notice.textContent = 'Parcel boundary from API · map backdrop is illustrative.';
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

  async function refresh() {
    const button = $('refreshButton'); button.disabled = true; button.querySelector('span').textContent = '…';
    try {
      let id = $('landSelect').value;
      if (!$('landSelect').options.length || $('landSelect').options[0].textContent === 'Loading lands…') id = await loadLands();
      await loadLand(id);
    } catch (error) { fail(error.message || 'Unable to load land data'); toast(error.message || 'Unable to connect to the backend'); }
    finally { button.disabled = false; button.querySelector('span').textContent = '↻'; }
  }

  $('refreshButton').addEventListener('click', refresh);
  $('landSelect').addEventListener('change', event => loadLand(event.target.value).catch(error => { fail(error.message); toast(error.message); }));
  $('simulateButton').addEventListener('click', () => {
    const action = $('simulationStep').value;
    const names = { verify: 'verify all ownership documents', resolve: 'resolve the active dispute', survey: 'order an independent land survey', all: 'complete all recommended checks' };
    const result = $('simulationResult');
    result.classList.add('active');
    const advice = action === 'resolve' || action === 'all' ? 'The dispute flag is a key screening concern. Ask the relevant authority for written resolution and have ownership records independently checked before proceeding.' : action === 'verify' ? 'Document verification can confirm record consistency. Request certified copies and resolve every mismatch with the issuing authority.' : 'An independent survey can clarify parcel boundaries and reveal encroachments. Compare the survey with registered deeds and official maps.';
    result.innerHTML = `<span class="result-spark">✳</span><div><b>Scenario: If you ${escapeHtml(names[action])}</b><p>${escapeHtml(advice)} Current backend score remains ${state.score === null ? 'unavailable' : `${state.score}/100`}; this scenario is guidance, not a recalculated score.</p></div>`;
  });
  $('mapExpand').addEventListener('click', () => { $('mapShell').classList.toggle('expanded'); $('mapExpand').textContent = $('mapShell').classList.contains('expanded') ? '⛶ Collapse map' : '⛶ Expand map'; });
  let zoom = 1; const mapSvg = document.querySelector('.map-svg');
  $('zoomIn').addEventListener('click', () => { zoom = Math.min(1.65, zoom + .12); mapSvg.style.transform = `scale(${zoom})`; });
  $('zoomOut').addEventListener('click', () => { zoom = Math.max(.8, zoom - .12); mapSvg.style.transform = `scale(${zoom})`; });
  $('locateMap').addEventListener('click', () => { zoom = 1; mapSvg.style.transform = ''; toast('Selected parcel centered'); });
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
  refresh();
})();
