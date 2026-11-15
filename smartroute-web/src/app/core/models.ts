export type Interest = 'NATURE' | 'HISTORY' | 'CULTURE' | 'FOOD' | 'VIEWPOINTS' | 'ACTIVE';
export type TransportMode = 'CAR' | 'MOTORCYCLE' | 'BIKE';
export type Decision = 'PENDING' | 'ALTERNATIVE' | 'DIRECT';
export type Role = 'USER' | 'ADMIN';

export interface Place { name: string; region: string | null; lat: number; lon: number; }
export interface Option<T extends string = string> { code: T; label: string; }

export interface Meta {
  interests: Option<Interest>[];
  modes: Option<TransportMode>[];
  aiEnabled: boolean;
  advisor: string;
  poiCount: number;
  poiCatalogReady: boolean;
}

export interface ProfileRequest {
  name: string;
  interests: Interest[];
  mode: TransportMode;
  maxExtraMinutes: number;
  maxStops: number;
  notes: string;
}
export interface Profile extends ProfileRequest { id: number; }

export interface RouteInfo { distanceKm: number; travelMinutes: number; visitMinutes: number; totalMinutes: number; }
export interface Stop {
  poiId: number; name: string; category: Interest; categoryLabel: string;
  lat: number; lon: number; visitMinutes: number; note: string;
  description: string | null; imageUrl: string | null; wikiUrl: string | null;
}
export interface Alternative {
  title: string; rationale: string; route: RouteInfo;
  extraMinutes: number; extraKm: number; stops: Stop[];
}
export interface Trip {
  id: number; origin: Place; destination: Place; mode: TransportMode;
  direct: RouteInfo; alternative: Alternative | null; message: string | null;
  advisor: string; fallbackReason: string | null; decision: Decision; createdAt: string;
}

export type LatLon = [number, number];
export interface TripGeometry { direct: LatLon[] | null; alternative: LatLon[] | null; }

export interface User { id: number; email: string; role: Role; }
export interface AuthResponse {
  accessToken: string; refreshToken: string; tokenType: string; expiresInSeconds: number; user: User;
}

export interface ProblemDetail { type?: string; title?: string; status?: number; detail?: string; }
