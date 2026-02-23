import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ProductoModel {
  id: number;
  codigo: string;
  idCategoria: number;
  categoriaNombre: string;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreacion: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnAbrirDetalle') btnAbrirDetalle!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Productos';

  /* =========================
     CATÁLOGO SIMULADO
  ========================== */
  categorias = [
    { id: 1, nombre: 'Ropa' },
    { id: 2, nombre: 'Calzado' },
    { id: 3, nombre: 'Accesorios' }
  ];

  /* =========================
     FILTROS
  ========================== */
  filtroCodigo = '';
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  /* =========================
     MODAL
  ========================== */
  modalTitulo = 'Crear Producto';
  editId: number | null = null;
  productoDetalle: ProductoModel | null = null;

  form = this.resetForm();

  /* =========================
     DATA DEMO
  ========================== */
  productos: ProductoModel[] = [];

  /* =========================
     GETTERS
  ========================== */

  get productosFiltrados(): ProductoModel[] {
    return this.productos.filter(p => {

      const cumpleCodigo =
        !this.filtroCodigo.trim() ||
        p.codigo.toLowerCase().includes(this.filtroCodigo.toLowerCase());

      const cumpleNombre =
        !this.filtroNombre.trim() ||
        p.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const cumpleEstado =
        !this.filtroEstado || p.estado === this.filtroEstado;

      const cumpleFecha =
        !this.filtroFecha || p.fechaCreacion === this.filtroFecha;

      return cumpleCodigo && cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  /* =========================
     CRUD
  ========================== */

  abrirNuevo() {
    this.modalTitulo = 'Crear Producto';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal();
  }

  abrirEditar(producto: ProductoModel) {
    this.modalTitulo = 'Editar Producto';
    this.editId = producto.id;
    this.form = {
      codigo: producto.codigo,
      idCategoria: String(producto.idCategoria),
      nombre: producto.nombre,
      descripcion: producto.descripcion
    };
    this.triggerModal();
  }

  verDetalle(producto: ProductoModel) {
    this.productoDetalle = producto;
    setTimeout(() => this.btnAbrirDetalle?.nativeElement.click(), 0);
  }

  guardar() {

    if (!this.form.codigo || !this.form.nombre) return;

    const idCategoriaNum = Number(this.form.idCategoria);

    if (this.editId !== null) {

      const index = this.productos.findIndex(p => p.id === this.editId);
      if (index !== -1) {
        this.productos[index] = {
          ...this.productos[index],
          codigo: this.form.codigo,
          idCategoria: idCategoriaNum,
          nombre: this.form.nombre,
          descripcion: this.form.descripcion,
          categoriaNombre: this.obtenerNombreCategoria(idCategoriaNum)
        };
      }

    } else {

      const nuevoId =
        this.productos.length > 0
          ? Math.max(...this.productos.map(p => p.id)) + 1
          : 1;

      this.productos.push({
        id: nuevoId,
        codigo: this.form.codigo,
        idCategoria: idCategoriaNum,
        categoriaNombre: this.obtenerNombreCategoria(idCategoriaNum),
        nombre: this.form.nombre,
        descripcion: this.form.descripcion,
        estado: 'Activo',
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  activarDesactivar(producto: ProductoModel) {
    producto.estado =
      producto.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  /* =========================
     UTILIDADES
  ========================== */

  resetForm() {
    return {
      codigo: '',
      idCategoria: '',
      nombre: '',
      descripcion: ''
    };
  }

  obtenerNombreCategoria(id: number) {
    return this.categorias.find(c => c.id == id)?.nombre || '';
  }

  private triggerModal() {
    setTimeout(() => this.btnAbrirModal?.nativeElement.click(), 0);
  }

  cerrarModal() {
    const modalEl = document.getElementById('modalProducto');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

}
