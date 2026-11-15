import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-logo',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="mark" [style.width.px]="size()" [style.height.px]="size()"><app-icon name="route" [size]="size() * .58" [stroke]="2.4" /></span>
    @if (text()) { <span class="word" [style.font-size.px]="size() * .6">SmartRoute</span> }`,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 12px; }
    .mark { display: grid; place-items: center; border-radius: 30%; background: var(--grad); color: #04222b;
            box-shadow: 0 8px 22px -8px var(--accent-glow); }
    .word { font-weight: 600; letter-spacing: -.01em; color: var(--text); }
  `,
})
export class Logo {
  readonly size = input(40);
  readonly text = input(true);
}
