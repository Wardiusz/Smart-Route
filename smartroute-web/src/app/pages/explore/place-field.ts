import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../../core/api.service';
import { Place } from '../../core/models';
import { samePlace } from '../../core/place';
import { Icon } from '../../shared/icon';

type SearchState = { status: 'idle' | 'loading' | 'ok' | 'error'; items: Place[]; message?: string };

const RECENT_KEY = 'sr.recentPlaces';
const RECENT_MAX = 6;

function readRecent(): Place[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.slice(0, RECENT_MAX) : [];
  } catch { return []; }
}

@Component({
  selector: 'app-place-field',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="field-btn" [attr.aria-expanded]="open()" aria-haspopup="listbox" (click)="toggle()">
      <span class="dot" [class.start]="kind() === 'start'"></span>
      <span class="txt">
        <small>{{ label() }}</small>
        <strong>{{ value()?.name ?? 'Wybierz miejscowość' }}@if (value()?.region; as r) {<span class="country">, {{ r }}</span>}</strong>
      </span>
      <app-icon name="chevron-down" [size]="16" />
    </button>
    @if (open()) {
      <div class="pop" role="listbox">
        <div class="search">
          <app-icon name="search" [size]="15" />
          <input #q type="text" placeholder="Wpisz miejscowość…" [value]="query()" autofocus
                 (input)="onInput(q.value)" (keydown.enter)="$event.preventDefault(); pickFirst()" />
          @if (state().status === 'loading') { <span class="spinner sm"></span> }
        </div>
        <ul>
          @if (showingRecent() && recent().length) { <li class="hdr">Ostatnio wybierane</li> }
          @if (!showingRecent() && state().status === 'error') {
            <li class="none err">{{ state().message }}</li>
          } @else {
            @for (p of shown(); track $index) {
              <li role="option" [attr.aria-selected]="isSelected(p)">
                <button type="button" [class.on]="isSelected(p)" (click)="pick(p)">
                  <app-icon [name]="showingRecent() ? 'history' : 'pin'" [size]="15" />
                  <span class="nm">{{ p.name }}@if (p.region) {<small>{{ p.region }}</small>}</span>
                  @if (isSelected(p)) { <app-icon name="check" [size]="15" class="ok" /> }
                </button>
              </li>
            } @empty {
              @if (showingRecent()) { <li class="none">Wpisz co najmniej 2 litery, np. „Sandomierz”.</li> }
              @else if (state().status === 'ok') { <li class="none">Brak wyników w Polsce</li> }
            }
          }
        </ul>
      </div>
    }`,
  styles: `
    :host { display: block; position: relative; }
    .field-btn { width: 100%; display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 14px; text-align: left;
                 border-radius: var(--radius); background: var(--input); border: 1px solid var(--border); color: var(--text-3);
                 transition: border-color .2s, box-shadow .2s; }
    .field-btn:hover { border-color: var(--border-strong); }
    .field-btn[aria-expanded=true] { border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-soft); }
    .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); flex: none; box-shadow: 0 0 10px var(--accent-glow); }
    .dot.start { background: transparent; border: 2px solid var(--accent); box-shadow: inset 0 0 0 2.5px var(--input), inset 0 0 0 9px var(--accent); }
    .txt { display: grid; flex: 1; min-width: 0; }
    small { font-size: 11px; color: var(--text-3); }
    strong { color: var(--text); font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .country { color: var(--text-2); font-weight: 400; }
    .pop { position: absolute; z-index: 1200; left: 0; right: 0; top: 62px; border-radius: var(--radius); background: var(--panel);
           border: 1px solid var(--border-strong); box-shadow: var(--shadow); padding: 8px; }
    .search { display: flex; align-items: center; gap: 8px; padding: 0 10px; height: 38px; border-radius: 10px; background: var(--input); color: var(--text-3); }
    .search input { flex: 1; background: none; border: 0; outline: 0; color: var(--text); height: 100%; }
    .spinner.sm { width: 14px; height: 14px; border-width: 2px; }
    ul { list-style: none; margin: 8px 0 0; padding: 0; max-height: 280px; overflow: auto; }
    li button { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 0; border-radius: 10px; background: none; color: var(--text); text-align: left; }
    li button:hover { background: var(--card); } li button.on { color: var(--accent); background: var(--accent-soft); }
    .nm { display: grid; min-width: 0; } .nm small { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ok { margin-left: auto; } .none { padding: 12px; color: var(--text-3); text-align: center; font-size: 13px; }
    .none.err { color: var(--danger, #f87171); }
    .hdr { padding: 4px 10px; font-size: 11px; letter-spacing: .04em; color: var(--text-3); text-transform: uppercase; }
  `,
})
export class PlaceField {
  readonly label = input.required<string>();
  readonly kind = input<'start' | 'end'>('start');
  readonly value = model<Place | null>(null);

  private readonly api = inject(ApiService);
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly query$ = new Subject<string>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly recent = signal<Place[]>(readRecent());
  protected readonly state = signal<SearchState>({ status: 'idle', items: [] });
  protected readonly showingRecent = computed(() => this.query().trim().length < 2);
  protected readonly shown = computed(() => (this.showingRecent() ? this.recent() : this.state().items));

  constructor() {
    this.query$.pipe(
      map((q) => q.trim()),
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((q) => q.length < 2
        ? of<SearchState>({ status: 'idle', items: [] })
        : this.api.places(q).pipe(
            map((items): SearchState => ({ status: 'ok', items })),
            catchError((e) => of<SearchState>({ status: 'error', items: [], message: errorMessage(e, 'Nie udało się wyszukać miejscowości.') })),
            startWith<SearchState>({ status: 'loading', items: this.state().items }),
          )),
      takeUntilDestroyed(),
    ).subscribe((s) => this.state.set(s));
  }

  protected onInput(v: string) { this.query.set(v); this.query$.next(v); }
  protected isSelected(p: Place) { return samePlace(p, this.value()); }

  protected toggle() {
    this.open.update((o) => !o);
    this.query.set('');
    this.query$.next('');
    this.recent.set(readRecent());
  }

  protected pickFirst() {
    const first = this.shown()[0];
    if (first) this.pick(first);
  }

  protected pick(p: Place) {
    this.value.set(p);
    this.open.set(false);
    const recent = [p, ...readRecent().filter((r) => !samePlace(r, p))].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  }

  @HostListener('document:click', ['$event'])
  onDoc(e: Event) { if (this.open() && !this.el.nativeElement.contains(e.target)) this.open.set(false); }
  @HostListener('document:keydown.escape')
  onEsc() { this.open.set(false); }
}
