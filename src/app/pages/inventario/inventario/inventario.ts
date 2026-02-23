import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface InventarioModel {
  id: number;
  idProducto: number;
  productoNombre: string;

  unidadMedida: string;

  cantidadInicial: number;
  cantidadActual: number;
  alertaMinima: number;

  estado: 'Activo' | 'Inactivo';

  usuarioCreacion: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario {

  @ViewChild('btnModal') btnModal!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnModalDetalle') btnModalDetalle!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Inventario';

  productos = [
    { id: 1, nombre: 'Camisa' },
    { id: 2, nombre: 'Zapatos' },
    { id: 3, nombre: 'Pantalón' }
  ];

  unidadesMedida = ['Unidad', 'Caja', 'Paquete', 'Metro', 'Litro'];

  filtroProducto: number = 0;
  filtroEstado: string = '';
  filtroFecha: string = '';

  inventarios: InventarioModel[] = [];

  editId: number | null = null;
  modalTitulo = 'Crear Inventario';

  inventarioDetalle!: InventarioModel;

  form = this.resetForm();

  get inventariosFiltrados() {
    return this.inventarios.filter(i =>
      (!this.filtroProducto || i.idProducto === this.filtroProducto) &&
      (!this.filtroEstado || i.estado === this.filtroEstado) &&
      (!this.filtroFecha || i.fechaCreacion === this.filtroFecha)
    );
  }

  abrirNuevo() {
    this.modalTitulo = 'Crear Inventario';
    this.editId = null;
    this.form = this.resetForm();
    setTimeout(() => this.btnModal.nativeElement.click(), 0);
  }

  abrirEditar(i: InventarioModel) {
    this.modalTitulo = 'Editar Inventario';
    this.editId = i.id;

    this.form = {
      idProducto: i.idProducto,
      unidadMedida: i.unidadMedida,
      cantidadInicial: i.cantidadInicial,
      cantidadActual: i.cantidadActual,
      alertaMinima: i.alertaMinima,
      estado: i.estado
    };

    setTimeout(() => this.btnModal.nativeElement.click(), 0);
  }

  verDetalle(i: InventarioModel) {
    this.inventarioDetalle = i;
    setTimeout(() => this.btnModalDetalle.nativeElement.click(), 0);
  }

  guardar() {

    if (!this.form.idProducto || !this.form.unidadMedida) {
      alert('Complete los campos obligatorios');
      return;
    }

    if (this.editId !== null) {
      const index = this.inventarios.findIndex(x => x.id === this.editId);
      if (index !== -1) {
        this.inventarios[index] = {
          ...this.inventarios[index],
          ...this.form,
          productoNombre: this.obtenerProducto(this.form.idProducto)
        };
      }
    } else {
      const nuevo: InventarioModel = {
        id: this.inventarios.length + 1,
        ...this.form,
        productoNombre: this.obtenerProducto(this.form.idProducto),
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      };
      this.inventarios.push(nuevo);
    }

    this.cerrarModal('modalInventario');
  }

  eliminar(i: InventarioModel) {
    i.estado = 'Inactivo';
  }

  obtenerProducto(id: number) {
    return this.productos.find(p => p.id === id)?.nombre || '';
  }

  stockBajo(i: InventarioModel) {
    return i.cantidadActual <= i.alertaMinima;
  }

  cerrarModal(id: string) {
    const modalEl = document.getElementById(id);
    const modal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modal?.hide();
  }

  resetForm() {
    return {
      idProducto: 0,
      unidadMedida: '',
      cantidadInicial: 0,
      cantidadActual: 0,
      alertaMinima: 0,
      estado: 'Activo' as 'Activo' | 'Inactivo'
    };
  }
}