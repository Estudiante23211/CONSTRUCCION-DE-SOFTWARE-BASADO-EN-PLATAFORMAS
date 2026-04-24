import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

type ApiErrorPayload = { message?: string };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  private extractMessage(err: unknown, fallback: string): string {
    // HttpErrorResponse.error puede ser string o {message}
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

  login(email: string, password: string): Observable<{ ok: boolean; message?: string }> {
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        timeout({ first: 10000 }),
        tap((r) => localStorage.setItem(this.tokenKey, r.token)),
        map(() => ({ ok: true } as const)),
        catchError((err) =>
          of({
            ok: false,
            message: this.extractMessage(err, 'No se pudo iniciar sesión'),
          })
        )
      );
  }

  /** Paso 1: verifica cuenta activa y obtiene token de recuperación. */
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

  /** Paso 2: actualiza contraseña con el token emitido en el paso 1. */
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
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
