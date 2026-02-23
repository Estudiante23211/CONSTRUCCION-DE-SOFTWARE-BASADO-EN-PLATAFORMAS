import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreador: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})

export class Roles {
  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Creación de Roles';

  /* Filtros */
  filtroNombre = '';
  filtroEstado = '';
  filtroFechaRegistro = '';

  /* Modal */
  modalTitulo = 'Creación de Roles';
  rolForm: { nombre: string; descripcion: string } = { nombre: '', descripcion: '' };
  rolEditId: number | null = null;

  /* Listado (datos de ejemplo) */
  roles: Rol[] = [
    {
      id: 1,
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-01-15',
    },
    {
      id: 2,
      nombre: 'Vendedor',
      descripcion: 'Gestión de pedidos y clientes',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-02-01',
    },
    {
      id: 3,
      nombre: 'Inventario',
      descripcion: 'Solo módulo de inventario',
      estado: 'Inactivo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-02-10',
    },
  ];

  get rolesFiltrados(): Rol[] {
    return this.roles.filter((r) => {
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        r.nombre.toLowerCase().includes(this.filtroNombre.trim().toLowerCase());
      const cumpleEstado =
        !this.filtroEstado || r.estado === this.filtroEstado;
      const cumpleFecha =
        !this.filtroFechaRegistro || r.fechaCreacion === this.filtroFechaRegistro;
      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  abrirModalNuevo(): void {
    this.modalTitulo = 'Creación de Rol';
    this.rolEditId = null;
    this.rolForm = { nombre: '', descripcion: '' };
    this.triggerAbrirModal();
  }

  abrirModalEditar(rol: Rol): void {
    this.modalTitulo = 'Edición de Rol';
    this.rolEditId = rol.id;
    this.rolForm = { nombre: rol.nombre, descripcion: rol.descripcion };
    this.triggerAbrirModal();
  }

  private triggerAbrirModal(): void {
    setTimeout(() => this.btnAbrirModal?.nativeElement?.click(), 0);
  }

  guardar(): void {
    const nombre = this.rolForm.nombre.trim();
    const descripcion = this.rolForm.descripcion.trim();
    if (!nombre) return;

    if (this.rolEditId !== null) {
      const idx = this.roles.findIndex((r) => r.id === this.rolEditId);
      if (idx !== -1) {
        this.roles[idx] = {
          ...this.roles[idx],
          nombre,
          descripcion,
        };
      }
    } else {
      const nuevoId =
        this.roles.length > 0
          ? Math.max(...this.roles.map((r) => r.id)) + 1
          : 1;
      this.roles.push({
        id: nuevoId,
        nombre,
        descripcion,
        estado: 'Activo',
        usuarioCreador: 'usuario@actual.com',
        fechaCreacion: new Date().toISOString().slice(0, 10),
      });
    }
    this.cerrarModal();
  }

  cerrarModal(): void {
    const modalEl = document.getElementById('modalRol');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

  activarDesactivar(rol: Rol): void {
    rol.estado = rol.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }
}
