import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'seguridad/roles',
    loadComponent: () =>
      import('./pages/seguridad/roles/roles')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'seguridad/usuarios',
    loadComponent: () =>
      import('./pages/seguridad/usuarios/usuarios')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'cliente/tipo-cliente',
    loadComponent: () =>
      import('./pages/cliente/tipo-client/tipo-client')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'cliente/categoria-cliente',
    loadComponent: () =>
      import('./pages/cliente/categoria-cliente/categoria-cliente')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'cliente/tipo-identificacion',
    loadComponent: () =>
      import('./pages/cliente/tipo-identificacion/tipo-identificacion')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'cliente/clientes',
    loadComponent: () =>
      import('./pages/cliente/clientes/clientes')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'producto/unidad-medida',
    loadComponent: () =>
      import('./pages/producto/unidad-medida/unidad-medida')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'producto/tipo-moneda',
    loadComponent: () =>
      import('./pages/producto/tipo-moneda/tipo-moneda')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'producto/categorias',
    loadComponent: () =>
      import('./pages/producto/categorias/categorias')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'producto/productos',
    loadComponent: () =>
      import('./pages/producto/productos/productos')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'pedidos/crear',
    loadComponent: () =>
      import('./pages/pedidos/crear-pedido/crear-pedido')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'pedidos/solicitud-entrega',
    loadComponent: () =>
      import('./pages/pedidos/solicitud-entrega/solicitud-entrega')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'inventario',
    loadComponent: () =>
      import('./pages/inventario/inventario/inventario')
        .then(m => Object.values(m)[0] as any)
  },

  {
    path: 'reportes',
    loadComponent: () =>
      import('./pages/reportes/reportes/reportes')
        .then(m => Object.values(m)[0] as any)
  },

  { path: '**', redirectTo: '' }

];
