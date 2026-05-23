import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth';

function apiMessage(err: HttpErrorResponse): string {
  const body = err.error;
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message?: string }).message;
    if (typeof m === 'string' && m.trim()) return m;
  }
  if (err.status === 0) {
    return 'No se pudo conectar con el servidor. Verifique que la API esté en ejecución.';
  }
  if (err.status === 401) return 'Sesión expirada o no autorizado.';
  if (err.status === 403) return 'No tiene permisos para esta acción.';
  if (err.status === 404) return 'Recurso no encontrado.';
  if (err.status >= 500) return 'Error interno del servidor. Intente más tarde.';
  return 'Ocurrió un error en la solicitud.';
}

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = req.url.startsWith(environment.apiUrl);
  const isAuthPublic =
    req.url.includes('/auth/login') || req.url.includes('/auth/recover/');

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !isApi) {
        return throwError(() => err);
      }

      if (err.status === 401 && !isAuthPublic) {
        auth.logout();
        toast.error(apiMessage(err));
        router.navigate(['/login']);
        return throwError(() => err);
      }

      if (!isAuthPublic && err.status === 0) {
        toast.error(apiMessage(err));
      }

      return throwError(() => err);
    })
  );
};
