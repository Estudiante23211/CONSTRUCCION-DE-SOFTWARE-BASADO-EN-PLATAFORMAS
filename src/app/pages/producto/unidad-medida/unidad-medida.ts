import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UnidadMedidaModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreacion: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-unidad-medida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unidad-medida.html',
  styleUrl: './unidad-medida.css',
})
export class UnidadMedida {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Unidades de Medida';

  /* =========================
     FILTROS
  ========================== */
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  /* =========================
     MODAL
  ========================== */
  modalTitulo = 'Crear Unidad de Medida';
  editId: number | null = null;

  form = this.resetForm();

  /* =========================
     DATA DEMO
  ========================== */
  unidades: UnidadMedidaModel[] = [];

  /* =========================
     GETTERS
  ========================== */

  get unidadesFiltradas(): UnidadMedidaModel[] {
    return this.unidades.filter(u => {

      const cumpleNombre =
        !this.filtroNombre.trim() ||
        u.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const cumpleEstado =
        !this.filtroEstado || u.estado === this.filtroEstado;

      const cumpleFecha =
        !this.filtroFecha || u.fechaCreacion === this.filtroFecha;

      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  /* =========================
     CRUD
  ========================== */

  abrirNuevo() {
    this.modalTitulo = 'Crear Unidad de Medida';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal();
  }

  abrirEditar(unidad: UnidadMedidaModel) {
    this.modalTitulo = 'Editar Unidad de Medida';
    this.editId = unidad.id;
    this.form = { ...unidad };
    this.triggerModal();
  }

  guardar() {

    if (!this.form.nombre.trim()) return;

    if (this.editId !== null) {

      const index = this.unidades.findIndex(u => u.id === this.editId);
      if (index !== -1) {
        this.unidades[index] = {
          ...this.unidades[index],
          ...this.form
        };
      }

    } else {

      const nuevoId =
        this.unidades.length > 0
          ? Math.max(...this.unidades.map(u => u.id)) + 1
          : 1;

      this.unidades.push({
        id: nuevoId,
        ...this.form,
        estado: 'Activo',
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  activarDesactivar(unidad: UnidadMedidaModel) {
    unidad.estado = unidad.estado === 'Activo'
      ? 'Inactivo'
      : 'Activo';
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
    const modalEl = document.getElementById('modalUnidad');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

}
