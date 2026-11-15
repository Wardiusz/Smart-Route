import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetaStore } from '../core/meta.store';
import { Interest, Profile, ProfileRequest, TransportMode } from '../core/models';
import { formatMinutes } from '../core/format';
import { INTEREST_ICON, Icon, MODE_ICON } from './icon';

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.error()) {
      <div class="alert" role="alert"><app-icon name="wifi-off" [size]="16" />
        <span>{{ store.error() }} <a href="#" (click)="$event.preventDefault(); store.load(true)">Spróbuj ponownie</a></span></div>
    } @else if (!store.meta()) {
      <div class="sk">
        <div class="skeleton" style="height:46px"></div>
        <div class="skeleton" style="height:90px"></div>
        <div class="skeleton" style="height:70px"></div>
        <div class="skeleton" style="height:46px"></div>
      </div>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="name">Jak mamy się do Ciebie zwracać?</label>
          <div class="input-wrap" [class.invalid]="form.controls.name.invalid && form.controls.name.touched">
            <span class="lead"><app-icon name="user" [size]="17" /></span>
            <input id="name" formControlName="name" maxlength="60" placeholder="np. Ania" />
          </div>
          @if (form.controls.name.invalid && form.controls.name.touched) { <span class="field-error">Podaj imię lub pseudonim (maks. 60 znaków).</span> }
        </div>

        <fieldset>
          <legend>Co lubisz oglądać po drodze?</legend>
          <div class="chips">
            @for (i of store.meta()!.interests; track i.code) {
              <button type="button" class="chip" [class.on]="has(i.code)" [attr.aria-pressed]="has(i.code)" (click)="toggle(i.code)">
                <app-icon [name]="icons[i.code]" [size]="16" />{{ i.label }}
              </button>
            }
          </div>
        </fieldset>

        <fieldset>
          <legend>Czym podróżujesz?</legend>
          <div class="modes">
            @for (m of store.meta()!.modes; track m.code) {
              <button type="button" class="mode" [class.on]="form.controls.mode.value === m.code" (click)="setMode(m.code)">
                <app-icon [name]="modeIcons[m.code]" [size]="22" /><span>{{ m.label }}</span>
              </button>
            }
          </div>
        </fieldset>

        <div class="sliders">
          <div class="field">
            <label for="extra">Ile dodatkowego czasu możesz poświęcić? <b>{{ fmt(form.controls.maxExtraMinutes.value) }}</b></label>
            <input id="extra" type="range" min="15" max="480" step="15" formControlName="maxExtraMinutes" />
          </div>
          <div class="field">
            <label for="stops">Maksymalna liczba przystanków <b>{{ form.controls.maxStops.value }}</b></label>
            <input id="stops" type="range" min="1" max="5" step="1" formControlName="maxStops" />
          </div>
        </div>

        <div class="field">
          <label for="notes">Coś jeszcze? <span class="opt">(opcjonalnie)</span></label>
          <textarea id="notes" formControlName="notes" rows="3" maxlength="500" placeholder="np. jadę z dziećmi, lubię zamki i małe wsie z dobrym jedzeniem"></textarea>
          <span class="count">{{ form.controls.notes.value.length }}/500</span>
        </div>

        @if (error()) { <div class="alert" role="alert"><app-icon name="alert" [size]="16" /><span>{{ error() }}</span></div> }

        <button class="btn btn-primary btn-block" type="submit" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> Zapisywanie… } @else { {{ submitLabel() }} <app-icon name="arrow-right" [size]="17" /> }
        </button>
      </form>
    }`,
  styles: `
    :host { display: block; }
    form, .sk { display: grid; gap: 20px; }
    fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 10px; }
    legend { font-size: 12px; font-weight: 600; color: var(--text-2); padding: 0; margin-bottom: 10px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 999px; background: var(--input);
            border: 1px solid var(--border); color: var(--text-2); transition: all .2s; }
    .chip:hover { border-color: var(--border-strong); color: var(--text); }
    .chip.on { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent); }
    .modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .mode { display: grid; justify-items: center; gap: 8px; padding: 14px 8px; border-radius: var(--radius); background: var(--input);
            border: 1px solid var(--border); color: var(--text-2); transition: all .2s; }
    .mode:hover { border-color: var(--border-strong); }
    .mode.on { background: var(--accent-soft); border-color: var(--accent-border); color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .sliders { display: grid; gap: 18px; }
    label b { color: var(--accent); margin-left: 6px; }
    .opt { color: var(--text-3); font-weight: 400; }
    input[type=range] { width: 100%; accent-color: var(--accent); }
    textarea { width: 100%; resize: vertical; padding: 12px 14px; border-radius: var(--radius); background: var(--input); border: 1px solid var(--border); outline: 0; }
    textarea:focus { border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-soft); }
    .count { justify-self: end; font-size: 11px; color: var(--text-3); }
    @media (max-width: 480px) { .modes { grid-template-columns: 1fr; } }
  `,
})
export class ProfileForm {
  protected readonly store = inject(MetaStore);
  private readonly fb = inject(FormBuilder);

  readonly initial = input<Profile | null>(null);
  readonly submitLabel = input('Zapisz');
  readonly saving = input(false);
  readonly error = input<string | null>(null);
  readonly save = output<ProfileRequest>();

  protected readonly icons = INTEREST_ICON;
  protected readonly modeIcons = MODE_ICON;
  protected readonly fmt = formatMinutes;

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    interests: [[] as Interest[]],
    mode: ['CAR' as TransportMode],
    maxExtraMinutes: [90],
    maxStops: [3],
    notes: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.store.load();
    effect(() => {
      const p = this.initial();
      if (p) this.form.patchValue({ ...p, interests: [...p.interests], notes: p.notes ?? '' });
    });
  }

  protected has(i: Interest) { return this.form.controls.interests.value.includes(i); }
  protected toggle(i: Interest) {
    const cur = this.form.controls.interests.value;
    this.form.controls.interests.setValue(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
  }
  protected setMode(m: TransportMode) { this.form.controls.mode.setValue(m); }

  protected submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.save.emit({ ...v, name: v.name.trim(), notes: v.notes.trim() });
  }
}
