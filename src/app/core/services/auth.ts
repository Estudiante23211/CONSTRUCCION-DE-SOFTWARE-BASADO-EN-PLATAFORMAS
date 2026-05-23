import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

type ApiErrorPayload = { message?: string };

export interface AuthProfile {
  nombre: string;
  apellido: string;
  rolNombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';
  private profileKey = 'auth_profile';

  readonly profile = signal<AuthProfile | null>(this.readStoredProfile());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private readStoredProfile(): AuthProfile | null {
    try {
      const raw = localStorage.getItem(this.profileKey);
      if (!raw) return this.profileFromToken();
      const p = JSON.parse(raw) as AuthProfile;
      if (this.isPlaceholderProfile(p)) {
        const fromToken = this.profileFromToken();
        if (fromToken) return fromToken;
      }
      return p;
    } catch {
      return this.profileFromToken();
    }
  }

  private isPlaceholderProfile(p: AuthProfile): boolean {
    const nombre = (p.nombre || '').trim();
    return !nombre || nombre === 'Usuario';
  }

  /** Extrae nombre/apellido/rol del JWT actual (sin llamar a la API). */
  private profileFromToken(): AuthProfile | null {
    const local = this.getUsuarioLocal();
    if (!local?.nombre && !local?.apellido && !local?.rol) return null;
    return {
      nombre: local.nombre?.trim() || '',
      apellido: local.apellido?.trim() || '',
      rolNombre: local.rol?.trim() || '—',
    };
  }

  private storeProfile(p: AuthProfile): void {
    if (!p.nombre?.trim() && !p.apellido?.trim()) return;
    localStorage.setItem(this.profileKey, JSON.stringify(p));
    this.profile.set(p);
  }

  private storeProfileFromToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as Record<string, string>;
      const p: AuthProfile = {
        nombre: String(payload['nombre'] ?? '').trim(),
        apellido: String(payload['apellido'] ?? '').trim(),
        rolNombre: String(payload['rol'] ?? '').trim() || '—',
      };
      if (p.nombre) this.storeProfile(p);
    } catch {
      /* token inválido */
    }
  }

  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'error' in err) {
      const e = (err as { error?: unknown }).error;
      if (typeof e === 'string' && e.trim()) return e;
      if (e && typeof e === 'object' && 'message' in e) {
        const m = (e as ApiErrorPayload).message;
        if (typeof m === 'string' && m.trim()) return m;
      }
    }
    return fallback;
  }

  /** Perfil del usuario en sesión (GET /api/auth/me). */
  getMe(): Observable<AuthProfile> {
    return this.http.get<Record<string, unknown>>(`${environment.apiUrl}/auth/me`).pipe(
      timeout({ first: 10000 }),
      map((raw) => this.normalizeProfile(raw))
    );
  }

  /** Datos básicos del JWT en localStorage (fallback si /me falla). */
  getUsuarioLocal(): {
    sub?: number;
    nombre?: string;
    apellido?: string;
    rol?: string;
    Usuario?: string;
  } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload as {
        sub?: number;
        nombre?: string;
        apellido?: string;
        rol?: string;
        Usuario?: string;
      };
    } catch {
      return null;
    }
  }

  private normalizeProfile(raw: Record<string, unknown>): AuthProfile {
    return {
      nombre: String(raw['nombre'] ?? raw['Nombre'] ?? '').trim(),
      apellido: String(raw['apellido'] ?? raw['Apellido'] ?? '').trim(),
      rolNombre: String(raw['rolNombre'] ?? raw['Rol'] ?? raw['rol'] ?? '—').trim() || '—',
    };
  }

  private applyLocalFallback(): AuthProfile {
    const fromToken = this.profileFromToken();
    if (fromToken?.nombre) {
      this.storeProfile(fromToken);
      return fromToken;
    }
    const stored = this.readStoredProfile();
    if (stored?.nombre && !this.isPlaceholderProfile(stored)) {
      this.profile.set(stored);
      return stored;
    }
    const fallback: AuthProfile = {
      nombre: 'Usuario',
      apellido: '',
      rolNombre: '—',
    };
    this.profile.set(fallback);
    return fallback;
  }

  /** Carga nombre y rol del usuario en sesión (sidebar). */
  loadSessionProfile(): Observable<AuthProfile | null> {
    if (!this.isAuthenticated()) {
      this.profile.set(null);
      return of(null);
    }
    const fromToken = this.profileFromToken();
    if (fromToken?.nombre && this.isPlaceholderProfile(this.profile() ?? fromToken)) {
      this.storeProfile(fromToken);
    }
    return this.getMe().pipe(
      tap((p) => this.storeProfile(p)),
      catchError(() => of(this.applyLocalFallback()))
    );
  }

  private profileOrLocal(): AuthProfile | null {
    const p = this.profile();
    if (p) return p;
    if (!this.isAuthenticated()) return null;
    const local = this.getUsuarioLocal();
    if (!local) return null;
    return {
      nombre: local.nombre?.trim() || local.Usuario?.trim() || 'Usuario',
      apellido: local.apellido?.trim() || '',
      rolNombre: local.rol?.trim() || '',
    };
  }

  get iniciales(): string {
    const p = this.profileOrLocal();
    const n = (p?.nombre || '').trim().charAt(0);
    const a = (p?.apellido || '').trim().charAt(0);
    const initials = `${n}${a}`.toUpperCase();
    return initials || 'U';
  }

  /** Primer nombre + primer apellido para el sidebar. */
  get primerNombre(): string {
    const p = this.profileOrLocal();
    if (!p?.nombre) return 'Usuario';
    const partesNombre = String(p.nombre).trim().split(/\s+/).filter(Boolean);
    const primerNombre = partesNombre[0] ?? '';
    const primerApellido =
      String(p.apellido ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)[0] ?? partesNombre[1] ?? '';
    return primerApellido ? `${primerNombre} ${primerApellido}` : primerNombre;
  }

  get rolLabel(): string {
    const p = this.profileOrLocal();
    const rol = p?.rolNombre?.trim();
    return rol && rol !== '—' ? rol : '—';
  }

  login(email: string, password: string): Observable<{ ok: boolean; message?: string }> {
    return this.http
      .post<{ token: string; usuario?: AuthProfile }>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        timeout({ first: 10000 }),
        tap((r) => {
          localStorage.setItem(this.tokenKey, r.token);
          if (r.usuario?.nombre) {
            this.storeProfile({
              nombre: r.usuario.nombre,
              apellido: r.usuario.apellido ?? '',
              rolNombre: r.usuario.rolNombre ?? '—',
            });
          } else {
            this.storeProfileFromToken(r.token);
          }
        }),
        tap(() => {
          this.loadSessionProfile().subscribe();
        }),
        map(() => ({ ok: true } as const)),
        catchError((err) =>
          of({
            ok: false,
            message: this.extractMessage(err, 'No se pudo iniciar sesión'),
          })
        )
      );
  }

  verifyForPasswordReset(
    login: string
  ): Observable<{ ok: true; resetToken: string } | { ok: false; message: string }> {
    return this.http
      .post<{ resetToken: string }>(`${environment.apiUrl}/auth/recover/verify`, { login })
      .pipe(
        timeout({ first: 10000 }),
        map((r) => ({ ok: true, resetToken: r.resetToken } as const)),
        catchError((err) =>
          of({
            ok: false as const,
            message: this.extractMessage(err, 'No se pudo verificar la cuenta'),
          })
        )
      );
  }

  resetPassword(
    resetToken: string,
    newPassword: string
  ): Observable<{ ok: true } | { ok: false; message: string }> {
    return this.http
      .post<{ ok: boolean }>(`${environment.apiUrl}/auth/recover/reset`, { resetToken, newPassword })
      .pipe(
        timeout({ first: 10000 }),
        map(() => ({ ok: true } as const)),
        catchError((err) =>
          of({
            ok: false as const,
            message: this.extractMessage(err, 'No se pudo restablecer la contraseña'),
          })
        )
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.profileKey);
    this.profile.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
