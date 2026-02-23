import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ClienteModel {
  id: number;

  idTipoCliente: number;
  tipoClienteNombre: string;

  idCategoriaCliente: number;
  categoriaClienteNombre: string;

  idTipoIdentificacion: number;
  tipoIdentificacionNombre: string;

  identificacion: string;
  digitoVerificacion?: string;

  nombre?: string;
  apellidos?: string;

  nombreComercial?: string;
  razonSocial?: string;

  direccion: string;
  celular: string;
  correo: string;

  estado: 'Activo' | 'Eliminado';

  usuarioCreacion: string;
  fechaCreacion: string;

  observacionEliminacion?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes {

  @ViewChild('btnModal') btnModal!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnDetalle') btnDetalle!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnEliminar') btnEliminar!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Clientes';

  /* CATÁLOGOS */
  tiposCliente = [
    { id: 1, nombre: 'Minorista' },
    { id: 2, nombre: 'Mayorista' }
  ];

  categoriasCliente = [
    { id: 1, nombre: 'Premium' },
    { id: 2, nombre: 'Frecuente' }
  ];

  tiposIdentificacion = [
    { id: 1, nombre: 'Cédula' },
    { id: 2, nombre: 'NIT' }
  ];

  /* FILTROS */
  filtroCategoria = '';
  filtroNombre = '';
  filtroFecha = '';

  /* MODAL */
  modalTitulo = '';
  editId: number | null = null;
  clienteDetalle!: ClienteModel | null;
  clienteEliminar!: ClienteModel | null;
  observacionEliminar = '';

  form: any = this.resetForm();

  clientes: ClienteModel[] = [];

  /* =======================
     GETTERS
  ======================= */

  get esNIT(): boolean {
    return this.form.idTipoIdentificacion == 2;
  }

  get clientesFiltrados(): ClienteModel[] {
    return this.clientes.filter(c => {

      const nombreMostrar = c.nombreComercial || `${c.nombre} ${c.apellidos}`;

      return (
        (!this.filtroCategoria || c.idCategoriaCliente == +this.filtroCategoria) &&
        (!this.filtroNombre ||
          nombreMostrar?.toLowerCase().includes(this.filtroNombre.toLowerCase())) &&
        (!this.filtroFecha || c.fechaCreacion === this.filtroFecha) &&
        c.estado === 'Activo'
      );
    });
  }

  /* =======================
     CRUD
  ======================= */

  abrirNuevo() {
    this.modalTitulo = 'Creación de Cliente';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal();
  }

  abrirEditar(cliente: ClienteModel) {
    this.modalTitulo = 'Edición de Cliente';
    this.editId = cliente.id;
    this.form = { ...cliente };
    this.triggerModal();
  }

  verDetalle(cliente: ClienteModel) {
    this.clienteDetalle = cliente;
    setTimeout(() => this.btnDetalle.nativeElement.click(), 0);
  }

  guardar() {

    if (!this.form.identificacion) return;

    if (this.editId !== null) {

      const index = this.clientes.findIndex(c => c.id === this.editId);

      this.clientes[index] = {
        ...this.clientes[index],
        ...this.form,
        idTipoIdentificacion: this.clientes[index].idTipoIdentificacion,
        identificacion: this.clientes[index].identificacion
      };

    } else {

      const nuevoId = this.clientes.length + 1;

      this.clientes.push({
        id: nuevoId,
        ...this.form,
        tipoClienteNombre: this.obtenerNombre(this.tiposCliente, this.form.idTipoCliente),
        categoriaClienteNombre: this.obtenerNombre(this.categoriasCliente, this.form.idCategoriaCliente),
        tipoIdentificacionNombre: this.obtenerNombre(this.tiposIdentificacion, this.form.idTipoIdentificacion),
        estado: 'Activo',
        usuarioCreacion: 'Admin',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  abrirEliminar(cliente: ClienteModel) {
    this.clienteEliminar = cliente;
    this.observacionEliminar = '';
    setTimeout(() => this.btnEliminar.nativeElement.click(), 0);
  }

  confirmarEliminar() {
    if (!this.observacionEliminar.trim()) return;

    this.clienteEliminar!.estado = 'Eliminado';
    this.clienteEliminar!.observacionEliminacion = this.observacionEliminar;
    this.cerrarModal('modalEliminar');
  }

  /* =======================
     UTILIDADES
  ======================= */

  resetForm() {
    return {
      idTipoCliente: '',
      idCategoriaCliente: '',
      idTipoIdentificacion: '',
      identificacion: '',
      digitoVerificacion: '',
      nombre: '',
      apellidos: '',
      nombreComercial: '',
      razonSocial: '',
      direccion: '',
      celular: '',
      correo: ''
    };
  }

  obtenerNombre(lista: any[], id: number) {
    return lista.find(x => x.id == id)?.nombre || '';
  }

  triggerModal() {
    setTimeout(() => this.btnModal.nativeElement.click(), 0);
  }

  cerrarModal(id: string = 'modalCliente') {
    const modalEl = document.getElementById(id);
    const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    if (inst) inst.hide();
  }
}