import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { Sidebar } from './core/layout/sidebar/sidebar';
import { Footer } from './core/layout/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Sidebar,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private router = inject(Router);

  /** Rutas públicas de autenticación sin sidebar ni footer de la app. */
  get isAuthFullscreenRoute(): boolean {
    const path = this.router.url.split('?')[0];
    return (
      path === '/login' ||
      path.startsWith('/auth/olvido-contrasena') ||
      path.startsWith('/auth/restablecer-contrasena')
    );
  }
}
