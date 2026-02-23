import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CategoriaProductoModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreacion: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css',
})
export class Categorias {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Creación de Categorías de Producto';

  /* =========================
     FILTROS
  ========================== */
  filtroNombre = '';
  filtroDescripcion = '';
  filtroEstado = '';
  filtroFecha = '';

  /* =========================
     MODAL
  ========================== */
  modalTitulo = 'Crear Categoría';
  editId: number | null = null;

  form = this.resetForm();

  /* =========================
     DATA DEMO
  ========================== */
  categorias: CategoriaProductoModel[] = [];

  /* =========================
     GETTERS
  ========================== */

  get categoriasFiltradas(): CategoriaProductoModel[] {
    return this.categorias.filter(c => {
  
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        c.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());
  
      const cumpleDescripcion =
        !this.filtroDescripcion.trim() ||
        c.descripcion?.toLowerCase().includes(this.filtroDescripcion.toLowerCase());
  
      const cumpleEstado =
        !this.filtroEstado || c.estado === this.filtroEstado;
  
      const cumpleFecha =
        !this.filtroFecha || c.fechaCreacion === this.filtroFecha;
  
      return cumpleNombre &&
             cumpleDescripcion &&
             cumpleEstado &&
             cumpleFecha;
    });
  }
  

  /* =========================
     CRUD
  ========================== */

  abrirNuevo() {
    this.modalTitulo = 'Crear Categoría';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal();
  }

  abrirEditar(categoria: CategoriaProductoModel) {
    this.modalTitulo = 'Editar Categoría';
    this.editId = categoria.id;
    this.form = { ...categoria };
    this.triggerModal();
  }

  guardar() {

    if (!this.form.nombre.trim()) return;

    if (this.editId !== null) {

      const index = this.categorias.findIndex(c => c.id === this.editId);
      if (index !== -1) {
        this.categorias[index] = {
          ...this.categorias[index],
          ...this.form
        };
      }

    } else {

      const nuevoId =
        this.categorias.length > 0
          ? Math.max(...this.categorias.map(c => c.id)) + 1
          : 1;

      this.categorias.push({
        id: nuevoId,
        ...this.form,
        estado: 'Activo',
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  activarDesactivar(categoria: CategoriaProductoModel) {
    categoria.estado =
      categoria.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  /* =========================
     UTILIDADES
  ========================== */

  resetForm() {
    return {
      nombre: '',
      descripcion: ''
    };
  }

  private triggerModal() {
    setTimeout(() => this.btnAbrirModal?.nativeElement.click(), 0);
  }

  cerrarModal() {
    const modalEl = document.getElementById('modalCategoria');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

}
