import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TipoClienteModel {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreador: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-tipo-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-client.html',
  styleUrl: './tipo-client.css',
})
export class TipoClient {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Tipos de Cliente';

  /* Filtros */
  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  /* Modal */
  modalTitulo = 'Creación de Tipo de Cliente';
  editId: number | null = null;

  form = {
    nombre: '',
    descripcion: ''
  };

  /* Datos de ejemplo */
  tipos: TipoClienteModel[] = [
    {
      id: 1,
      nombre: 'Juridico',
      descripcion: 'Entidad legalmente constituida (empresa, organización o sociedad) que actúa como sujeto de derechos y obligaciones.',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-01-15'
    },
    {
      id: 2,
      nombre: 'Natural',
      descripcion: 'Persona física que actúa a título personal, con derechos y obligaciones propios',
      estado: 'Activo',
      usuarioCreador: 'Usuario de Prueba',
      fechaCreacion: '2025-02-01'
    }
  ];

  get tiposFiltrados(): TipoClienteModel[] {
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

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Tipo de Cliente';
    this.editId = null;
    this.form = { nombre: '', descripcion: '' };
    this.triggerModal();
  }

  abrirEditar(tipo: TipoClienteModel): void {
    this.modalTitulo = 'Edición de Tipo de Cliente';
    this.editId = tipo.id;
    this.form = {
      nombre: tipo.nombre,
      descripcion: tipo.descripcion
    };
    this.triggerModal();
  }

  guardar(): void {
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
      const nuevoId =
        this.tipos.length > 0
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

  activarDesactivar(tipo: TipoClienteModel): void {
    tipo.estado = tipo.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  private triggerModal(): void {
    setTimeout(() => this.btnAbrirModal?.nativeElement?.click(), 0);
  }

  cerrarModal(): void {
    const modalEl = document.getElementById('modalTipoCliente');
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }

}
