import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const base = environment.apiUrl;
  if (!req.url.startsWith(base)) {
    return next(req);
  }
  if (req.url.includes('/auth/login') || req.url.includes('/auth/recover/')) {
    return next(req);
  }
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
