import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TipoMonedaModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreacion: string;
  fechaCreacion: string;
}

interface TipoMonedaForm {
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-tipo-moneda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-moneda.html',
  styleUrl: './tipo-moneda.css',
})
export class TipoMoneda {

  @ViewChild('btnModal') btnModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Tipo de Moneda';

  // Filtros
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  modalTitulo = 'Crear Tipo de Moneda';
  editId: number | null = null;

  form: TipoMonedaForm = this.resetForm();

  tiposMoneda: TipoMonedaModel[] = [];

  // ================= FILTRO =================
  get listaFiltrada(): TipoMonedaModel[] {
    return this.tiposMoneda.filter(t =>
      (!this.filtroNombre || t.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase())) &&
      (!this.filtroEstado || t.estado === this.filtroEstado) &&
      (!this.filtroFecha || t.fechaCreacion === this.filtroFecha)
    );
  }

  // ================= CRUD =================
  abrirNuevo() {
    this.modalTitulo = 'Crear Tipo de Moneda';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal();
  }

  abrirEditar(t: TipoMonedaModel) {
    this.modalTitulo = 'Editar Tipo de Moneda';
    this.editId = t.id;

    this.form = {
      nombre: t.nombre,
      descripcion: t.descripcion
    };

    this.triggerModal();
  }

  guardar() {

    if (!this.form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (this.editId !== null) {

      const index = this.tiposMoneda.findIndex(t => t.id === this.editId);

      if (index !== -1) {
        this.tiposMoneda[index] = {
          ...this.tiposMoneda[index],
          ...this.form
        };
      }

    } else {

      const nuevoId = this.tiposMoneda.length > 0
        ? Math.max(...this.tiposMoneda.map(t => t.id)) + 1
        : 1;

      this.tiposMoneda.push({
        id: nuevoId,
        ...this.form,
        estado: 'Activo',
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  cambiarEstado(t: TipoMonedaModel) {
    t.estado = t.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  // ================= UTIL =================
  resetForm(): TipoMonedaForm {
    return {
      nombre: '',
      descripcion: ''
    };
  }

  private triggerModal() {
    setTimeout(() => this.btnModal?.nativeElement.click(), 0);
  }

  cerrarModal() {
    const modalEl = document.getElementById('modalTipoMoneda');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }
}