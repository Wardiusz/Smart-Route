'use strict';

const PROFILE_KEY = 'smartroute.profileId';
const $ = (id) => document.getElementById(id);

const state = { meta: null, profileId: null, trip: null, map: null, layers: null };


async function api(path, options = {}) {
    const res = await fetch('/api' + path, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
        let detail = `Błąd ${res.status}`;
        try { detail = (await res.json()).detail || detail; } catch (_) {  }
        const err = new Error(detail);
        err.status = res.status;
        throw err;
    }
    return res.json();
}


function escapeHtml(text) {
    return String(text ?? '').replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatMinutes(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h} h ${m} min` : `${m} min`;
}

function signed(value, unit) {
    return `${value >= 0 ? '+' : '−'}${Math.abs(value)} ${unit}`;
}


function renderProfileForm(profile) {
    const { interests, modes } = state.meta;
    $('p-interests').innerHTML = interests.map((i) => `
        <label><input type="checkbox" value="${i.code}" ${profile?.interests?.includes(i.code) ? 'checked' : ''}>
        <span>${escapeHtml(i.label)}</span></label>`).join('');
    $('p-mode').innerHTML = modes.map((m) =>
        `<option value="${m.code}" ${profile?.mode === m.code ? 'selected' : ''}>${escapeHtml(m.label)}</option>`).join('');
    $('p-name').value = profile?.name ?? '';
    $('p-extra').value = profile?.maxExtraMinutes ?? 120;
    $('p-stops').value = profile?.maxStops ?? 2;
    $('p-notes').value = profile?.notes ?? '';
    updateExtraLabel();
}

function readProfileForm() {
    return {
        name: $('p-name').value.trim() || 'Podróżnik',
        interests: [...$('p-interests').querySelectorAll('input:checked')].map((el) => el.value),
        mode: $('p-mode').value,
        maxExtraMinutes: Number($('p-extra').value),
        maxStops: Number($('p-stops').value),
        notes: $('p-notes').value.trim(),
    };
}

function updateExtraLabel() {
    $('p-extra-label').textContent = formatMinutes(Number($('p-extra').value));
}

async function saveProfile() {
    const body = readProfileForm();
    const profile = state.profileId
        ? await api(`/profiles/${state.profileId}`, { method: 'PUT', body })
        : await api('/profiles', { method: 'POST', body });
    state.profileId = profile.id;
    localStorage.setItem(PROFILE_KEY, profile.id);
    return profile;
}

async function loadProfile() {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return null;
    try {
        const profile = await api(`/profiles/${stored}`);
        state.profileId = profile.id;
        return profile;
    } catch (e) {
        localStorage.removeItem(PROFILE_KEY);
        return null;
    }
}


const placeLabel = (p) => (p.region ? `${p.name} (${p.region})` : p.name);
let suggestTimer;

function suggestPlaces(text) {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(async () => {
        if (text.trim().length < 2) return;
        try {
            const places = await api('/places?q=' + encodeURIComponent(text.trim()));
            $('place-options').innerHTML = places.map((p) => `<option value="${escapeHtml(placeLabel(p))}"></option>`).join('');
        } catch (_) {  }
    }, 250);
}

async function resolvePlace(text) {
    const query = text.replace(/\s*\(.*\)\s*$/, '').trim();
    const places = await api('/places?q=' + encodeURIComponent(query));
    const place = places.find((p) => placeLabel(p) === text.trim()) ?? places[0];
    if (!place) throw new Error(`Nie znaleziono miejscowości „${text}”`);
    return place;
}


async function planTrip(event) {
    event.preventDefault();
    const btn = $('plan-btn');
    const errorBox = $('trip-error');
    errorBox.hidden = true;
    btn.disabled = true;
    btn.textContent = 'AI szuka ciekawszej drogi…';
    try {
        await saveProfile();
        state.trip = await api('/trips', {
            method: 'POST',
            body: {
                profileId: state.profileId,
                origin: await resolvePlace($('t-origin').value),
                destination: await resolvePlace($('t-destination').value),
            },
        });
        renderTrip(state.trip);
        await loadHistory();
    } catch (e) {
        errorBox.textContent = e.message;
        errorBox.hidden = false;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Zaproponuj trasę';
    }
}

function renderTrip(trip) {
    $('result').hidden = false;
    const { direct, alternative } = trip;

    $('r-direct-name').textContent = `${trip.origin.name} → ${trip.destination.name}`;
    $('r-direct-stats').innerHTML = `
        <dt>Dystans</dt><dd>ok. ${Math.round(direct.distanceKm)} km</dd>
        <dt>Czas jazdy</dt><dd>${formatMinutes(direct.totalMinutes)}</dd>`;

    $('r-source').textContent = trip.advisor;
    $('r-source').className = 'badge small' + (trip.advisor?.startsWith('Claude') ? '' : ' offline');

    if (trip.fallbackReason) {
        console.warn('Rekomendacja AI nie powiodła się:', trip.fallbackReason);
    }
    const warning = trip.fallbackReason
        ? '<p class="warning">Wystąpił błąd podczas generowania rekomendacji AI – poniżej propozycja zastępcza.</p>' : '';

    if (alternative) {
        $('r-alt-body').innerHTML = `
            <p class="route-name">${escapeHtml(alternative.title)}</p>
            ${warning}
            <p class="rationale">${escapeHtml(alternative.rationale)}</p>
            <dl class="stats">
                <dt>Dystans</dt><dd>ok. ${Math.round(alternative.route.distanceKm)} km
                    <span class="delta">(${signed(Math.round(alternative.extraKm), 'km')})</span></dd>
                <dt>Jazda</dt><dd>${formatMinutes(alternative.route.travelMinutes)}</dd>
                <dt>Zwiedzanie</dt><dd>${formatMinutes(alternative.route.visitMinutes)}</dd>
                <dt>Razem</dt><dd>${formatMinutes(alternative.route.totalMinutes)}
                    <span class="delta">(${signed(alternative.extraMinutes, 'min')})</span></dd>
            </dl>
            <ol class="stops">${alternative.stops.map((s) => `
                <li><strong>${escapeHtml(s.name)}</strong> <span class="cat">· ${escapeHtml(s.categoryLabel)} · ${s.visitMinutes} min</span>
                <br>${escapeHtml(s.note)}</li>`).join('')}
            </ol>`;
    } else {
        $('r-alt-body').innerHTML = `${warning}<p class="rationale">${escapeHtml(trip.message)}</p>`;
    }
    $('choose-alt').hidden = !alternative;
    renderDecision(trip);
    renderMap(trip);
}

function renderDecision(trip) {
    const box = $('r-decision');
    const labels = {
        ALTERNATIVE: '✓ Wybrałeś trasę zaproponowaną przez AI. Udanej podróży!',
        DIRECT: '✓ Zostajesz przy trasie standardowej.',
    };
    box.hidden = trip.decision === 'PENDING';
    box.textContent = labels[trip.decision] ?? '';
    $('choose-alt').disabled = trip.decision === 'ALTERNATIVE';
    $('choose-direct').disabled = trip.decision === 'DIRECT';
}

async function decide(decision) {
    if (!state.trip) return;
    try {
        state.trip = await api(`/trips/${state.trip.id}/decision`, { method: 'POST', body: { decision } });
        renderDecision(state.trip);
        await loadHistory();
    } catch (e) {
        alert(e.message);
    }
}


function renderMap(trip) {
    if (typeof L === 'undefined') {
        $('map').textContent = 'Mapa niedostępna (brak połączenia z CDN Leaflet).';
        return;
    }
    if (!state.map) {
        state.map = L.map('map', { zoomSnap: 0.25 });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; OpenStreetMap',
        }).addTo(state.map);
        state.layers = L.layerGroup().addTo(state.map);
    }
    state.layers.clearLayers();

    const a = [trip.origin.lat, trip.origin.lon];
    const b = [trip.destination.lat, trip.destination.lon];

    L.polyline([a, b], { color: '#7b8790', weight: 4, dashArray: '8 8' })
        .bindTooltip('Trasa standardowa').addTo(state.layers);

    const points = [a];
    (trip.alternative?.stops ?? []).forEach((s, i) => {
        points.push([s.lat, s.lon]);
        L.marker([s.lat, s.lon], {
            icon: L.divIcon({ className: 'num-marker', html: String(i + 1), iconSize: [24, 24] }),
        }).bindPopup(`<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(s.note)}`).addTo(state.layers);
    });
    points.push(b);
    if (trip.alternative) {
        L.polyline(points, { color: '#1f7a5c', weight: 5 }).bindTooltip('Propozycja AI').addTo(state.layers);
    }

    L.circleMarker(a, { radius: 8, color: '#1f2a2e', fillOpacity: 1 }).bindTooltip(`Start: ${escapeHtml(trip.origin.name)}`).addTo(state.layers);
    L.circleMarker(b, { radius: 8, color: '#1f2a2e', fillColor: '#fff', fillOpacity: 1 }).bindTooltip(`Cel: ${escapeHtml(trip.destination.name)}`).addTo(state.layers);

    setTimeout(() => {
        state.map.invalidateSize();
        state.map.fitBounds(L.latLngBounds(points).pad(0.15));
    }, 0);
}


async function loadHistory() {
    const list = $('history');
    if (!state.profileId) {
        list.innerHTML = '<li class="hint">Brak zaplanowanych tras.</li>';
        return;
    }
    const trips = await api(`/trips?profileId=${state.profileId}`);
    const labels = { PENDING: 'bez decyzji', ALTERNATIVE: 'trasa AI', DIRECT: 'standardowa' };
    list.innerHTML = trips.length ? trips.map((t) => `
        <li>
            <span><strong>${escapeHtml(t.origin.name)} → ${escapeHtml(t.destination.name)}</strong>
            <br><span class="hint">${escapeHtml(t.alternative?.title ?? 'brak alternatywy')}</span></span>
            <span class="pill ${t.decision}">${labels[t.decision]}</span>
        </li>`).join('') : '<li class="hint">Brak zaplanowanych tras.</li>';
}


async function init() {
    state.meta = await api('/meta');

    const badge = $('ai-badge');
    badge.textContent = state.meta.aiEnabled ? `AI: ${state.meta.advisor}` : 'Tryb offline (bez klucza AI)';
    badge.classList.toggle('offline', !state.meta.aiEnabled);

    $('t-origin').value = 'Warszawa';
    $('t-destination').value = 'Kraków';
    for (const id of ['t-origin', 't-destination']) {
        $(id).addEventListener('input', () => suggestPlaces($(id).value));
    }

    renderProfileForm(await loadProfile());
    await loadHistory();

    $('p-extra').addEventListener('input', updateExtraLabel);
    $('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await saveProfile();
            $('profile-status').textContent = 'Zapisano ✓';
            setTimeout(() => { $('profile-status').textContent = ''; }, 2000);
            await loadHistory();
        } catch (err) {
            $('profile-status').textContent = err.message;
        }
    });
    $('trip-form').addEventListener('submit', planTrip);
    $('swap').addEventListener('click', () => {
        const o = $('t-origin').value;
        $('t-origin').value = $('t-destination').value;
        $('t-destination').value = o;
    });
    $('choose-alt').addEventListener('click', () => decide('ALTERNATIVE'));
    $('choose-direct').addEventListener('click', () => decide('DIRECT'));
}

init().catch((e) => {
    document.body.insertAdjacentHTML('afterbegin', `<p class="error" style="padding:1rem">Nie udało się uruchomić aplikacji: ${escapeHtml(e.message)}</p>`);
});
