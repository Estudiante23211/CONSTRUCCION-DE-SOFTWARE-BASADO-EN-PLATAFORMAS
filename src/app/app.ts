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

  get isLoginRoute(): boolean {
    return this.router.url.includes('/login');
  }
}
