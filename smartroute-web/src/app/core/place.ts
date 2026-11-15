import { Place } from './models';

export const DEFAULT_ORIGIN: Place = { name: 'Warszawa', region: 'województwo mazowieckie', lat: 52.2297, lon: 21.0122 };
export const DEFAULT_DESTINATION: Place = { name: 'Gdańsk', region: 'województwo pomorskie', lat: 54.352, lon: 18.6466 };

export function samePlace(a: Place | null | undefined, b: Place | null | undefined): boolean {
  return !!a && !!b && Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
}

export function placeKey(p: Place | null | undefined): string {
  return p ? `${p.lat.toFixed(4)},${p.lon.toFixed(4)}` : '-';
}

export function encodePlace(p: Place): string {
  return `${p.name}@${p.lat.toFixed(5)},${p.lon.toFixed(5)}`;
}

export function decodePlace(v: string | null | undefined): Place | null {
  const m = v?.match(/^(.+)@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[2]), lon = Number(m[3]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { name: m[1], region: null, lat, lon } : null;
}
