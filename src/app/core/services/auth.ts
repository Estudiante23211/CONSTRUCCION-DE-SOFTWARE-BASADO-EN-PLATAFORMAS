import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenKey = 'auth_token';

  constructor(private router: Router) {}

  login(email: string, password: string) {

    // Simulación (aquí luego va el backend)
    if (email === 'admin@kalsan.com' && password === '123456') {

      const fakeToken = 'jwt-token-demo';

      localStorage.setItem(this.tokenKey, fakeToken);

      return true;
    }

    return false;
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