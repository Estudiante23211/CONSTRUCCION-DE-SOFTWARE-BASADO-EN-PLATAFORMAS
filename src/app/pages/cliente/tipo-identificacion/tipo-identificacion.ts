import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TipoIdentificacionModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreador: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-tipo-identificacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-identificacion.html',
  styleUrl: './tipo-identificacion.css',
})
export class TipoIdentificacion {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Tipos de Identificación';

  /* Filtros */
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  /* Modal */
  modalTitulo = 'Creación de Tipo de Identificación';
  editId: number | null = null;
  form = {
    nombre: '',
    descripcion: ''
  };

  /* Datos de ejemplo */
  tipos: TipoIdentificacionModel[] = [
    {
      id: 1,
      nombre: 'Cédula de Ciudadanía',
      descripcion: 'Documento nacional de identificación',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-01-10'
    },
    {
      id: 2,
      nombre: 'NIT',
      descripcion: 'Número de Identificación Tributaria',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-01-12'
    }
  ];

  get tiposFiltrados(): TipoIdentificacionModel[] {
    return this.tipos.filter(t => {
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        t.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const cumpleEstado =
        !this.filtroEstado || t.estado === this.filtroEstado;

      const cumpleFecha =
        !this.filtroFecha || t.fechaCreacion === this.filtroFecha;

      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  abrirNuevo() {
    this.modalTitulo = 'Creación de Tipo de Identificación';
    this.editId = null;
    this.form = { nombre: '', descripcion: '' };
    this.triggerModal();
  }

  abrirEditar(tipo: TipoIdentificacionModel) {
    this.modalTitulo = 'Edición de Tipo de Identificación';
    this.editId = tipo.id;
    this.form = {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion
    };
    this.triggerModal();
  }

  private triggerModal() {
    setTimeout(() => this.btnAbrirModal?.nativeElement.click(), 0);
  }

  guardar() {
    const nombre = this.form.nombre.trim();
    const descripcion = this.form.descripcion.trim();

    if (!nombre) return;

    if (this.editId !== null) {
      const index = this.tipos.findIndex(t => t.id === this.editId);
      if (index !== -1) {
        this.tipos[index] = {
          ...this.tipos[index],
          nombre,
          descripcion
        };
      }
    } else {
      const nuevoId = this.tipos.length > 0
        ? Math.max(...this.tipos.map(t => t.id)) + 1
        : 1;

      this.tipos.push({
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

  cerrarModal() {
    const modalEl = document.getElementById('modalTipo');
    if (modalEl) {
      const instance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (instance) instance.hide();
    }
  }

  activarDesactivar(tipo: TipoIdentificacionModel) {
    tipo.estado = tipo.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

}
