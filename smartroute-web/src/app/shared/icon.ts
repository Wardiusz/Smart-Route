import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const c = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const l = (x1: number, y1: number, x2: number, y2: number) => `M${x1} ${y1}L${x2} ${y2}`;
const rect = (x: number, y: number, w: number, h: number, r = 2) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

const ICONS: Record<string, string[]> = {
  route: ['M7 5h6a4 4 0 0 1 0 8h-3a4 4 0 0 0 0 8h7'],
  sparkles: [
    'M9.9 15.5A2 2 0 0 0 8.5 14.1l-6.1-1.6a.5.5 0 0 1 0-1l6.1-1.6A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z',
    'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3',
  ],
  info: [c(12, 12, 10), 'M12 16v-4', 'M12 8h.01'],
  'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
  swap: ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
  bookmark: ['m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'],
  layers: ['m12.8 2.2a2 2 0 0 0-1.6 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9a1 1 0 0 0 0-1.8z', 'm22 17.7-9.2 4.1a2 2 0 0 1-1.6 0L2 17.7', 'm22 12.7-9.2 4.1a2 2 0 0 1-1.6 0L2 12.7'],
  plus: ['M5 12h14', 'M12 5v14'],
  minus: ['M5 12h14'],
  locate: [c(12, 12, 7), c(12, 12, 2), l(12, 1, 12, 4), l(12, 20, 12, 23), l(1, 12, 4, 12), l(20, 12, 23, 12)],
  navigation: ['M12 3l7 17-7-4-7 4z'],
  mountain: ['m8 3 4 8 5-5 5 15H2z'],
  waves: [
    'M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
    'M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1',
  ],
  cup: ['M10 2v2', 'M14 2v2', 'M6 2v2', 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1'],
  landmark: ['M3 22h18', 'M6 18v-7', 'M10 18v-7', 'M14 18v-7', 'M18 18v-7', 'M12 2 3 7h18z', 'M3 18h18'],
  leaf: ['M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z', 'M2 21c0-3 1.9-5.4 5.1-6 2.4-.5 4.9-2 5.9-3'],
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  bike: [c(5.5, 17.5, 3.5), c(18.5, 17.5, 3.5), c(15, 5, 1), 'M12 17.5V14l-3-3 4-3 2 3h2'],
  car: ['M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', c(7, 17, 2), c(17, 17, 2), 'M9 17h6'],
  sun: [c(12, 12, 4), 'M12 2v2', 'M12 20v2', 'm4.9 4.9 1.4 1.4', 'm17.7 17.7 1.4 1.4', 'M2 12h2', 'M20 12h2', 'm6.3 17.7-1.4 1.4', 'm19.1 4.9-1.4 1.4'],
  moon: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'],
  monitor: [rect(2, 3, 20, 14), 'M8 21h8', 'M12 17v4'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', c(12, 7, 4)],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  history: [c(12, 12, 10), 'M12 6v6l4 2'],
  sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  mail: [rect(2, 4, 20, 16), 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
  lock: [rect(3, 11, 18, 11), 'M7 11V7a5 5 0 0 1 10 0v4'],
  eye: ['M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z', c(12, 12, 3)],
  'eye-off': ['M9.9 9.9a3 3 0 1 0 4.2 4.2', 'M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7', 'M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7a9.7 9.7 0 0 0 5.4-1.6', 'm2 2 20 20'],
  check: ['M20 6 9 17l-5-5'],
  clock: [c(12, 12, 10), 'M12 6v6l4 2'],
  alert: ['m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3', 'M12 9v4', 'M12 17h.01'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  'chevron-down': ['m6 9 6 6 6-6'],
  search: [c(11, 11, 8), 'm21 21-4.3-4.3'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', c(12, 10, 3)],
  'wifi-off': ['M12 20h.01', 'M8.5 16.4a5 5 0 0 1 7 0', 'M2 8.8a15 15 0 0 1 4.2-2.6', 'M5 12.9a10 10 0 0 1 5.2-2.7', 'M22 8.8a15 15 0 0 0-8.4-4.7', 'M19 12.9a10 10 0 0 0-2-1.5', 'm2 2 20 20'],
  compass: [c(12, 12, 10), 'm16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z'],
  flag: ['M4 22V4a1 1 0 0 1 .4-.8A6.1 6.1 0 0 1 8 2c3 0 5 2 7.5 2a6.1 6.1 0 0 0 3.6-1.2A.5.5 0 0 1 20 3.2v10.6a1 1 0 0 1-.4.8A6.1 6.1 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.5'],
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @for (p of paths(); track $index) { <path [attr.d]="p" /> }
    </svg>`,
  styles: `:host { display: inline-flex; line-height: 0; flex: none; }`,
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(18);
  readonly stroke = input(1.9);
  protected readonly paths = computed(() => ICONS[this.name()] ?? []);
}

export const INTEREST_ICON: Record<string, string> = {
  NATURE: 'leaf', HISTORY: 'landmark', CULTURE: 'book', FOOD: 'cup', VIEWPOINTS: 'mountain', ACTIVE: 'bike',
};
export const MODE_ICON: Record<string, string> = { CAR: 'car', MOTORCYCLE: 'bike', BIKE: 'bike' };
