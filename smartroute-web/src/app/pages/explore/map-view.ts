import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, viewChild, ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import { formatMinutes } from '../../core/format';
import { LatLon, Place, Stop, Trip, TripGeometry } from '../../core/models';
import { placeKey, samePlace } from '../../core/place';
import { ThemeService } from '../../core/theme.service';
import { environment } from '../../../environments/environment';

type Selected = 'DIRECT' | 'ALTERNATIVE';

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const toLatLngs = (line: LatLon[]) => line.map(([lat, lon]) => L.latLng(lat, lon));
const middleOf = (path: L.LatLng[]) =>
  path.length === 2 ? L.latLng((path[0].lat + path[1].lat) / 2, (path[0].lng + path[1].lng) / 2) : path[Math.floor(path.length / 2)];

const safeUrl = (u: string | null) => (u && /^https:\/\//.test(u) ? esc(u) : null);
const stopPopup = (s: Stop) => {
  const img = safeUrl(s.imageUrl), wiki = safeUrl(s.wikiUrl);
  return `<div class="sr-pop">`
    + (img ? `<img src="${img}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : '')
    + `<b>${esc(s.name)}</b><small>${esc(s.categoryLabel)} · ${s.visitMinutes} min</small>`
    + (s.description ? `<p>${esc(s.description)}</p>` : '')
    + (wiki ? `<a href="${wiki}" target="_blank" rel="noopener">Więcej w Wikipedii →</a>` : '')
    + `</div>`;
};

const TILES = (t: 'dark' | 'light') =>
  `https://basemaps.cartocdn.com/rastertiles/${t}_all/{z}/{x}/{y}.png?key=${encodeURIComponent(environment.cartoBasemapsKey)}`;

if (!environment.cartoBasemapsKey) {
  console.warn('Brak klucza CARTO Basemaps – ustaw cartoBasemapsKey w src/environments/environment.ts');
}

@Component({
  selector: 'app-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<div #host class="map-host"></div>`,
  styles: `
    app-map-view { display: block; position: absolute; inset: 0; z-index: 0; isolation: isolate; }
    .map-host { position: absolute; inset: 0; background: var(--bg-2); font-family: var(--font); }
    .map-host .leaflet-tile-pane { filter: var(--map-filter); }
    .map-host::after { content: ''; position: absolute; inset: 0; z-index: 400; pointer-events: none; background: var(--map-tint); }
    .map-host .leaflet-control-attribution { background: var(--glass); color: var(--text-3); border-radius: 8px 0 0 0; font-size: 10px; backdrop-filter: blur(6px); }
    .map-host .leaflet-control-attribution a { color: var(--text-2); }

    .sr-direct { stroke: var(--route-direct); }
    .sr-alt, .sr-alt-glow { stroke: var(--route-alt); }
    .sr-alt-glow { filter: blur(5px); }
    .leaflet-overlay-pane path.sr-dim { opacity: .35; }

    .sr-pin { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 13px;
              color: #04222b; border: 3px solid var(--panel); box-shadow: 0 0 0 2px var(--accent), 0 0 18px var(--accent-glow); background: var(--accent); }
    .sr-pin-a { background: var(--lavender); box-shadow: 0 0 0 2px var(--lavender), 0 0 18px color-mix(in srgb, var(--lavender) 60%, transparent); }
    .sr-pin-s { width: 28px; height: 28px; font-size: 12px; }
    .sr-pin-pre { opacity: .9; }
    .sr-me { width: 16px; height: 16px; border-radius: 50%; background: #3b82f6; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(59,130,246,.25); }

    .leaflet-tooltip.sr-label { background: var(--glass); color: var(--text); border: 1px solid var(--border-strong); border-radius: 10px;
                                box-shadow: var(--shadow-sm); padding: 5px 10px; font-weight: 500; font-size: 12px; backdrop-filter: blur(8px); }
    .leaflet-tooltip.sr-label::before { display: none; }

    .sr-bubble { position: absolute; white-space: nowrap; padding: 8px 12px; border-radius: 12px; display: grid; line-height: 1.2;
                 background: var(--glass); border: 1px solid var(--border-strong); color: var(--text); box-shadow: var(--shadow-sm);
                 backdrop-filter: blur(8px); font-weight: 600; font-size: 15px; pointer-events: none; }
    .sr-bubble small { font-weight: 400; font-size: 11px; color: var(--text-2); }

    .sr-popup .leaflet-popup-content-wrapper { background: var(--panel); color: var(--text); border: 1px solid var(--border-strong);
                                               border-radius: 14px; box-shadow: var(--shadow); padding: 0; overflow: hidden; }
    .sr-popup .leaflet-popup-content { margin: 0; font-family: var(--font); }
    .sr-popup .leaflet-popup-tip { background: var(--panel); }
    .sr-popup a.leaflet-popup-close-button { color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
    .sr-pop { display: grid; gap: 4px; padding-bottom: 12px; }
    .sr-pop img { width: 100%; height: 140px; object-fit: cover; display: block; margin-bottom: 6px; background: var(--accent-soft); }
    .sr-pop b, .sr-pop small, .sr-pop p, .sr-pop a { margin: 0 14px; }
    .sr-pop b { font-size: 14px; padding-top: 10px; } .sr-pop img + b { padding-top: 0; }
    .sr-pop small { color: var(--text-3); font-size: 11px; }
    .sr-pop p { font-size: 12px; color: var(--text-2); line-height: 1.4; }
    .sr-pop p::first-letter { text-transform: uppercase; }
    .sr-pop a { font-size: 12px; font-weight: 500; color: var(--accent); }
    .sr-bubble-direct { transform: translate(calc(-100% - 14px), -50%); }
    .sr-bubble-alt { transform: translate(14px, -50%); background: var(--grad); color: #04222b; border: 0; box-shadow: 0 8px 26px -6px var(--accent-glow); }
    .sr-bubble-alt small { color: rgba(4, 34, 43, .75); }
  `,
})
export class MapView implements OnDestroy {
  readonly origin = input<Place | null>(null);
  readonly destination = input<Place | null>(null);
  readonly trip = input<Trip | null>(null);
  readonly geometry = input<TripGeometry | null>(null);
  readonly selected = input<Selected>('ALTERNATIVE');
  readonly showLabels = input(true);
  readonly showDirect = input(true);
  readonly leftInset = input(0);
  readonly bottomInset = input(0);
  readonly locateFailed = output<string>();

  private readonly theme = inject(ThemeService);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private map?: L.Map;
  private tiles?: L.TileLayer;
  private readonly layer = L.layerGroup();
  private me?: L.Marker;
  private ro?: ResizeObserver;
  private lastKey = '';

  constructor() {
    afterNextRender(() => this.init());
    effect(() => {
      this.draw();
    });
    effect(() => {
      const t = this.theme.theme();
      if (this.tiles) this.tiles.setUrl(TILES(t));
    });
  }

  private init() {
    const map = L.map(this.host().nativeElement, { zoomControl: false, attributionControl: true, minZoom: 4, maxZoom: 16 })
      .setView([52.0, 19.4], 6);
    map.attributionControl.setPrefix(false);
    this.tiles = L.tileLayer(TILES(this.theme.theme()), {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    this.layer.addTo(map);
    this.map = map;
    this.ro = new ResizeObserver(() => map.invalidateSize());
    this.ro.observe(this.host().nativeElement);
    this.draw();
  }

  ngOnDestroy() { this.ro?.disconnect(); this.map?.remove(); }

  zoomIn() { this.map?.zoomIn(); }
  zoomOut() { this.map?.zoomOut(); }
  recenter() { this.fit(true); }
  locate() {
    if (!navigator.geolocation) { this.locateFailed.emit('Twoja przeglądarka nie wspiera geolokalizacji.'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const ll = L.latLng(p.coords.latitude, p.coords.longitude);
        this.me?.remove();
        this.me = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="sr-me"></div>', iconSize: [16, 16] }), interactive: false }).addTo(this.map!);
        this.map?.flyTo(ll, Math.max(this.map.getZoom(), 9));
      },
      () => this.locateFailed.emit('Nie udało się ustalić Twojej lokalizacji.'),
      { timeout: 8000 },
    );
  }

  private draw() {
    const o = this.origin(), d = this.destination(), trip = this.trip(), geo = this.geometry();
    const sel = this.selected();
    const labels = this.showLabels(), showDirect = this.showDirect();
    this.leftInset(); this.bottomInset();
    if (!this.map) return;

    this.layer.clearLayers();
    const pts: L.LatLng[] = [];
    const A = o ? L.latLng(o.lat, o.lon) : null;
    const B = d ? L.latLng(d.lat, d.lon) : null;
    if (A) pts.push(A);
    if (B) pts.push(B);

    const alt = trip?.alternative ?? null;
    const hasTrip = !!trip && samePlace(trip.origin, o) && samePlace(trip.destination, d);

    if (A && B && (showDirect || !hasTrip)) {
      const dim = hasTrip && sel === 'ALTERNATIVE';
      const directPath = hasTrip && geo?.direct ? toLatLngs(geo.direct) : [A, B];
      if (hasTrip) directPath.forEach((p) => pts.push(p));
      L.polyline(directPath, { className: 'sr-direct' + (dim ? '' : ''), color: 'var(--route-direct)', weight: dim ? 3 : 4, opacity: dim ? 0.85 : 1, dashArray: '9 9', lineCap: 'round', lineJoin: 'round' }).addTo(this.layer);
      if (hasTrip) {
        this.bubble(middleOf(directPath), 'direct', formatMinutes(trip!.direct.totalMinutes), 'Trasa standardowa');
      }
    }

    if (hasTrip && alt) {
      const path = geo?.alternative ? toLatLngs(geo.alternative) : [A!, ...alt.stops.map((s) => L.latLng(s.lat, s.lon)), B!];
      path.forEach((p) => pts.push(p));
      const dim = sel === 'DIRECT';
      L.polyline(path, { className: 'sr-alt-glow', color: 'var(--route-alt)', weight: 14, opacity: dim ? 0.1 : 0.3, lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(this.layer);
      L.polyline(path, { className: 'sr-alt', color: 'var(--route-alt)', weight: 5, opacity: dim ? 0.45 : 1, lineCap: 'round', lineJoin: 'round' }).addTo(this.layer);

      const mid = alt.stops.length ? L.latLng(alt.stops[Math.floor((alt.stops.length - 1) / 2)].lat, alt.stops[Math.floor((alt.stops.length - 1) / 2)].lon)
                                   : L.latLng((A!.lat + B!.lat) / 2, (A!.lng + B!.lng) / 2);
      this.bubble(mid, 'alt', formatMinutes(alt.route.totalMinutes), 'Bardziej widokowa droga');

      alt.stops.forEach((s, i) => {
        const m = L.marker([s.lat, s.lon], { icon: this.pin(String(i + 1), 'sr-pin-s'), zIndexOffset: 500 }).addTo(this.layer);
        m.bindTooltip(esc(s.name), { permanent: labels, direction: 'right', offset: [16, 0], className: 'sr-label' });
        m.bindPopup(stopPopup(s), { className: 'sr-popup', maxWidth: 260, minWidth: 220, offset: [0, -10] });
      });
    }

    if (A && o) this.endpoint(A, 'A', 'sr-pin-a', o.name, labels, hasTrip);
    if (B && d) this.endpoint(B, 'B', '', d.name, labels, hasTrip);

    const key = `${placeKey(o)}-${placeKey(d)}-${hasTrip ? trip!.id : 'pre'}-${hasTrip && geo ? 'road' : 'line'}`;
    if (key !== this.lastKey) { this.lastKey = key; this.pending = pts; this.fit(false); }
  }

  private pending: L.LatLng[] = [];

  private fit(animate: boolean) {
    const map = this.map;
    if (!map) return;
    const pts = this.pending;
    if (!pts.length) { map.setView([52.0, 19.4], 6); return; }
    const left = this.leftInset(), bottom = this.bottomInset();
    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, {
      paddingTopLeft: [left + 60, 90], paddingBottomRight: [60, bottom + 90], maxZoom: 10, animate,
    });
  }

  private endpoint(ll: L.LatLng, letter: string, cls: string, name: string, labels: boolean, hasTrip: boolean) {
    const m = L.marker(ll, { icon: this.pin(letter, cls + (hasTrip ? '' : ' sr-pin-pre')), zIndexOffset: 1000 }).addTo(this.layer);
    m.bindTooltip(esc(name), { permanent: labels, direction: 'right', offset: [18, 0], className: 'sr-label' });
  }

  private pin(text: string, cls: string) {
    return L.divIcon({ className: '', html: `<div class="sr-pin ${cls}">${text}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
  }

  private bubble(ll: L.LatLng, kind: 'direct' | 'alt', time: string, sub: string) {
    L.marker(ll, {
      interactive: false, zIndexOffset: 800,
      icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="sr-bubble sr-bubble-${kind}">${time}<small>${sub}</small></div>` }),
    }).addTo(this.layer);
  }
}
