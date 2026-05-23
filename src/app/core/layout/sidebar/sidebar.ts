import { Component, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';

export type SidebarGroup = 'seguridad' | 'cliente' | 'producto' | 'pedido';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private navSub?: Subscription;

  readonly collapsed = signal(false);
  readonly collapsedChange = output<boolean>();

  openGroup: SidebarGroup | null = null;

  ngOnInit(): void {
    this.syncOpenGroupFromUrl(this.router.url);
    this.loadPerfil();
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.syncOpenGroupFromUrl(e.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  private syncOpenGroupFromUrl(url: string): void {
    const path = url.split('?')[0];
    if (path.startsWith('/seguridad')) this.openGroup = 'seguridad';
    else if (path.startsWith('/cliente')) this.openGroup = 'cliente';
    else if (path.startsWith('/producto')) this.openGroup = 'producto';
    else if (path.startsWith('/pedidos')) this.openGroup = 'pedido';
    else this.openGroup = null;
  }

  toggleGroup(grupo: SidebarGroup, event?: Event): void {
    event?.preventDefault();
    this.openGroup = this.openGroup === grupo ? null : grupo;
  }

  isGroupOpen(grupo: SidebarGroup): boolean {
    return this.openGroup === grupo;
  }

  toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
    this.collapsedChange.emit(this.collapsed());
  }

  loadPerfil(): void {
    if (!this.authService.isAuthenticated()) return;
    this.authService.loadSessionProfile().subscribe();
  }

  cerrarSesion(): void {
    this.authService.logout();
  }

  get auth() {
    return this.authService;
  }

  get showProfile(): boolean {
    return this.authService.isAuthenticated();
  }
}
