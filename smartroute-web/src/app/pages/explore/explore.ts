import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { formatKm, formatMinutes } from '../../core/format';
import { MetaStore } from '../../core/meta.store';
import { Decision, Place, Stop, Trip, TripGeometry } from '../../core/models';
import { DEFAULT_DESTINATION, DEFAULT_ORIGIN, decodePlace, samePlace } from '../../core/place';
import { ProfileStore } from '../../core/profile.store';
import { ToastService } from '../../core/toast.service';
import { INTEREST_ICON, Icon } from '../../shared/icon';
import { Logo } from '../../shared/logo';
import { UserMenu } from '../../shared/user-menu';
import { MapView } from './map-view';
import { PlaceField } from './place-field';

type Phase = 'idle' | 'loading' | 'done' | 'error';
type Selected = 'DIRECT' | 'ALTERNATIVE';

const LOADING_STEPS = [
  'Wyznaczam trasę standardową…',
  'Szukam ciekawych miejsc po drodze…',
  'Dopasowuję przystanki do Twoich preferencji…',
  'Układam trasę w kolejności przejazdu…',
];

@Component({
  selector: 'app-explore',
  imports: [Icon, Logo, PlaceField, MapView, UserMenu, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './explore.html',
  styleUrl: './explore.scss',
})
export class Explore {
  private readonly api = inject(ApiService);
  private readonly metaStore = inject(MetaStore);
  protected readonly profileStore = inject(ProfileStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly map = viewChild(MapView);

  readonly from = input<string>();
  readonly to = input<string>();

  protected readonly meta = this.metaStore.meta;
  protected readonly metaError = this.metaStore.error;
  protected readonly icons = INTEREST_ICON;
  protected readonly fmt = formatMinutes;
  protected readonly km = formatKm;

  protected readonly origin = signal<Place | null>(null);
  protected readonly destination = signal<Place | null>(null);
  private initialized = false;
  protected readonly phase = signal<Phase>('idle');
  protected readonly trip = signal<Trip | null>(null);
  protected readonly selected = signal<Selected>('ALTERNATIVE');
  protected readonly error = signal<string | null>(null);
  protected readonly stepIdx = signal(0);
  protected readonly deciding = signal(false);
  protected readonly layersOpen = signal(false);
  protected readonly showLabels = signal(true);
  protected readonly showDirect = signal(true);
  protected readonly loadingStep = computed(() => LOADING_STEPS[this.stepIdx() % LOADING_STEPS.length]);

  protected readonly sameCity = computed(() => samePlace(this.origin(), this.destination()));
  protected readonly canSearch = computed(() => !!this.origin() && !!this.destination() && !this.sameCity() && this.phase() !== 'loading');

  private readonly geometry = signal<{ tripId: number; data: TripGeometry } | null>(null);
  protected readonly tripGeometry = computed(() => {
    const g = this.geometry();
    return g && g.tripId === this.trip()?.id ? g.data : null;
  });

  protected readonly alt = computed(() => this.trip()?.alternative ?? null);
  protected readonly routeCount = computed(() => (this.trip() ? (this.alt() ? 2 : 1) : 0));
  protected readonly decided = computed(() => {
    const d = this.trip()?.decision;
    return d && d !== 'PENDING' ? d : null;
  });
  protected readonly leftInset = computed(() => (typeof window !== 'undefined' && window.innerWidth > 900 ? 420 : 0));
  protected readonly bottomInset = signal(0);
  protected readonly hasHistory = signal(false);

  constructor() {
    this.metaStore.load();
    const pid = this.profileStore.profile()?.id;
    if (pid) this.api.history(pid).subscribe({ next: (h) => this.hasHistory.set(h.length > 0), error: () => undefined });

    effect(() => {
      const f = decodePlace(this.from()), t = decodePlace(this.to());
      if (this.initialized) return;
      this.initialized = true;
      untracked(() => {
        this.origin.set(f ?? DEFAULT_ORIGIN);
        this.destination.set(t ?? DEFAULT_DESTINATION);
        if (f && t && !samePlace(f, t)) this.search();
      });
    });
  }

  private readonly resetOnChange = effect(() => {
    const o = this.origin(), d = this.destination();
    untracked(() => {
      const t = this.trip();
      if (t && (!samePlace(t.origin, o) || !samePlace(t.destination, d))) { this.trip.set(null); this.phase.set('idle'); }
    });
  });

  protected swap() {
    const o = this.origin();
    this.origin.set(this.destination());
    this.destination.set(o);
  }

  protected search() {
    const pid = this.profileStore.profile()?.id;
    const o = this.origin(), d = this.destination();
    if (!pid || !o || !d || samePlace(o, d)) return;

    this.phase.set('loading');
    this.error.set(null);
    this.stepIdx.set(0);
    this.trip.set(null);
    const tick = interval(1400).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.stepIdx.update((i) => i + 1));

    this.api.planTrip(pid, o, d).subscribe({
      next: (t) => {
        tick.unsubscribe();
        this.trip.set(t);
        this.selected.set(t.alternative ? 'ALTERNATIVE' : 'DIRECT');
        this.phase.set('done');
        this.hasHistory.set(true);
        this.loadGeometry(t.id);
      },
      error: (e) => { tick.unsubscribe(); this.error.set(errorMessage(e, 'Nie udało się wyznaczyć trasy.')); this.phase.set('error'); },
    });
  }

  private loadGeometry(tripId: number) {
    this.api.tripGeometry(tripId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.geometry.set({ tripId, data }),
      error: () => undefined,
    });
  }

  protected choose(kind: Selected) {
    const t = this.trip();
    if (!t || this.deciding()) return;
    this.selected.set(kind);
    this.deciding.set(true);
    this.api.decide(t.id, kind as Exclude<Decision, 'PENDING'>).subscribe({
      next: (nt) => {
        this.trip.set(nt);
        this.deciding.set(false);
        this.toast.success(kind === 'ALTERNATIVE' ? 'Wybrano inteligentną alternatywę. Miłej podróży!' : 'Wybrano trasę standardową.');
      },
      error: (e) => { this.deciding.set(false); this.toast.error(errorMessage(e)); },
    });
  }

  protected readonly openStop = signal<number | null>(null);
  private readonly brokenImages = signal<ReadonlySet<string>>(new Set());

  protected toggleStop(s: Stop) { this.openStop.update((id) => (id === s.poiId ? null : s.poiId)); }
  protected imageOf(s: Stop) { return s.imageUrl && !this.brokenImages().has(s.imageUrl) ? s.imageUrl : null; }
  protected imageFailed(s: Stop) {
    const url = s.imageUrl;
    if (url) this.brokenImages.update((set) => new Set(set).add(url));
  }

  protected reloadMeta() { this.metaStore.load(true); }
  protected pad(i: number) { return String(i + 1).padStart(2, '0'); }
  protected zoomIn() { this.map()?.zoomIn(); }
  protected zoomOut() { this.map()?.zoomOut(); }
  protected recenter() { this.map()?.recenter(); }
  protected locate() { this.map()?.locate(); }
  protected onLocateFailed(msg: string) { this.toast.error(msg); }
}
