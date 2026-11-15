import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthResponse, Decision, Meta, Place, Profile, ProfileRequest, Trip, TripGeometry, User } from './models';

export const API_URL = '';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, { email, password });
  }
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password });
  }
  refresh(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken });
  }
  me(): Observable<User> {
    return this.http.get<User>(`${API_URL}/auth/me`);
  }

  meta(): Observable<Meta> {
    return this.http.get<Meta>(`${API_URL}/api/meta`);
  }
  createProfile(req: ProfileRequest): Observable<Profile> {
    return this.http.post<Profile>(`${API_URL}/api/profiles`, req);
  }
  getProfile(id: number): Observable<Profile> {
    return this.http.get<Profile>(`${API_URL}/api/profiles/${id}`);
  }
  updateProfile(id: number, req: ProfileRequest): Observable<Profile> {
    return this.http.put<Profile>(`${API_URL}/api/profiles/${id}`, req);
  }
  places(q: string): Observable<Place[]> {
    return this.http.get<Place[]>(`${API_URL}/api/places`, { params: new HttpParams().set('q', q) });
  }
  planTrip(profileId: number, origin: Place, destination: Place): Observable<Trip> {
    return this.http.post<Trip>(`${API_URL}/api/trips`, { profileId, origin, destination });
  }
  decide(tripId: number, decision: Exclude<Decision, 'PENDING'>): Observable<Trip> {
    return this.http.post<Trip>(`${API_URL}/api/trips/${tripId}/decision`, { decision });
  }
  tripGeometry(tripId: number): Observable<TripGeometry> {
    return this.http.get<TripGeometry>(`${API_URL}/api/trips/${tripId}/geometry`);
  }
  history(profileId: number): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${API_URL}/api/trips`, { params: new HttpParams().set('profileId', profileId) });
  }
}

export function errorMessage(err: unknown, fallback = 'Coś poszło nie tak. Spróbuj ponownie.'): string {
  const e = err as { status?: number; error?: { detail?: string } };
  if (e?.status === 0) return 'Brak połączenia z serwerem. Sprawdź, czy backend działa.';
  return e?.error?.detail || fallback;
}
