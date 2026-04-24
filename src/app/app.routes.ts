import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [

  // 🔓 LOGIN (PÚBLICO)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login')
        .then(m => m.Login)
  },

  // 🔓 RECUPERACIÓN DE CONTRASEÑA (PÚBLICO)
  {
    path: 'auth/olvido-contrasena',
    loadComponent: () =>
      import('./pages/auth/forgot-password/forgot-password')
        .then(m => m.ForgotPassword)
  },
  {
    path: 'auth/restablecer-contrasena',
    loadComponent: () =>
      import('./pages/auth/reset-password/reset-password')
        .then(m => m.ResetPassword)
  },

  // 🔐 DASHBOARD
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => m.Dashboard)
  },

  // 🔐 SEGURIDAD
  {
    path: 'seguridad/roles',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/seguridad/roles/roles')
        .then(m => m.Roles)
  },

  {
    path: 'seguridad/usuarios',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/seguridad/usuarios/usuarios')
        .then(m => m.Usuarios)
  },

  // 🔐 CLIENTES
  {
    path: 'cliente/tipo-cliente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cliente/tipo-client/tipo-client')
        .then(m => m.TipoClient)
  },

  {
    path: 'cliente/categoria-cliente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cliente/categoria-cliente/categoria-cliente')
        .then(m => m.CategoriaCliente)
  },

  {
    path: 'cliente/tipo-identificacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cliente/tipo-identificacion/tipo-identificacion')
        .then(m => m.TipoIdentificacion)
  },

  {
    path: 'cliente/clientes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/cliente/clientes/clientes')
        .then(m => m.Clientes)
  },

  // 🔐 PRODUCTOS
  {
    path: 'producto/unidad-medida',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/producto/unidad-medida/unidad-medida')
        .then(m => m.UnidadMedida)
  },

  {
    path: 'producto/tipo-moneda',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/producto/tipo-moneda/tipo-moneda')
        .then(m => m.TipoMoneda)
  },

  {
    path: 'producto/categorias',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/producto/categorias/categorias')
        .then(m => m.Categorias)
  },

  {
    path: 'producto/productos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/producto/productos/productos')
        .then(m => m.Productos)
  },

  // 🔐 PEDIDOS
  {
    path: 'pedidos/crear',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/pedidos/crear-pedido/crear-pedido')
        .then(m => m.CrearPedido)
  },

  // 🔐 INVENTARIO
  {
    path: 'inventario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/inventario/inventario/inventario')
        .then(m => m.Inventario)
  },

  // 🔐 REPORTES
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/reportes/reportes/reportes')
        .then(m => m.Reportes)
  },

  // ❌ Ruta no encontrada
  { path: '**', redirectTo: '' }

];