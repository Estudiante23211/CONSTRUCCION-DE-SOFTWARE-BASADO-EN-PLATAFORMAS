import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CategoriaClienteModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreador: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-categoria-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-cliente.html',
  styleUrl: './categoria-cliente.css',
})
export class CategoriaCliente {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Categorías de Cliente';

  /* =======================
     FILTROS
  ======================== */
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  /* =======================
     MODAL
  ======================== */
  modalTitulo = 'Creación de Categoría de Cliente';
  editId: number | null = null;

  form = {
    nombre: '',
    descripcion: ''
  };

  /* =======================
     DATOS DEMO
  ======================== */
  categorias: CategoriaClienteModel[] = [
    {
      id: 1,
      nombre: 'Premium',
      descripcion: 'Clientes con beneficios exclusivos',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-01-10'
    },
    {
      id: 2,
      nombre: 'Frecuente',
      descripcion: 'Clientes con compras recurrentes',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-02-05'
    }
  ];

  /* =======================
     FILTRO DINÁMICO
  ======================== */
  get categoriasFiltradas(): CategoriaClienteModel[] {
    return this.categorias.filter(c => {

      const cumpleNombre =
        !this.filtroNombre.trim() ||
        c.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const cumpleEstado =
        !this.filtroEstado || c.estado === this.filtroEstado;

      const cumpleFecha =
        !this.filtroFecha || c.fechaCreacion === this.filtroFecha;

      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  /* =======================
     CRUD
  ======================== */

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Categoría de Cliente';
    this.editId = null;
    this.form = { nombre: '', descripcion: '' };
    this.triggerModal();
  }

  abrirEditar(categoria: CategoriaClienteModel): void {
    this.modalTitulo = 'Edición de Categoría de Cliente';
    this.editId = categoria.id;
    this.form = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion
    };
    this.triggerModal();
  }

  guardar(): void {
    const nombre = this.form.nombre.trim();
    const descripcion = this.form.descripcion.trim();

    if (!nombre) return;

    if (this.editId !== null) {

      const index = this.categorias.findIndex(c => c.id === this.editId);

      if (index !== -1) {
        this.categorias[index] = {
          ...this.categorias[index],
          nombre,
          descripcion
        };
      }

    } else {

      const nuevoId =
        this.categorias.length > 0
          ? Math.max(...this.categorias.map(c => c.id)) + 1
          : 1;

      this.categorias.push({
        id: nuevoId,
        nombre,
        descripcion,
        estado: 'Activo',
        usuarioCreador: 'usuario@actual.com',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });

    }

    this.cerrarModal();
  }

  activarDesactivar(categoria: CategoriaClienteModel): void {
    categoria.estado =
      categoria.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  /* =======================
     MODAL CONTROL
  ======================== */

  private triggerModal(): void {
    setTimeout(() => this.btnAbrirModal?.nativeElement?.click(), 0);
  }

  cerrarModal(): void {
    const modalEl = document.getElementById('modalCategoriaCliente');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

}
