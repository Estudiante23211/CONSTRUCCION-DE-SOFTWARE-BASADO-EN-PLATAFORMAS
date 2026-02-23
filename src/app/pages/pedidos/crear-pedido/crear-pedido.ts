import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PedidoModel {
  id: number;

  idCliente: number;
  clienteNombre: string;

  idProducto: number;
  productoNombre: string;

  moneda: string;
  simboloMoneda: string;

  descripcion: string;
  cantidad: number;
  medidas: string;
  descuento: number;
  precioUnitario: number;
  subtotal: number;
  total: number;

  estado: 'Pendiente' | 'En proceso de envío' | 'Entregado' | 'Cancelado';

  usuarioCreacion: string;
  fechaCreacion: string;
  observacionEliminacion?: string;
}

interface PedidoForm {
  idCliente: number;
  idProducto: number;
  moneda: string;
  descripcion: string;
  cantidad: number;
  medidas: string;
  descuento: number;
  precioUnitario: number;
  subtotal: number;
  total: number;
}

@Component({
  selector: 'app-crear-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-pedido.html',
  styleUrl: './crear-pedido.css',
})
export class CrearPedido {

  @ViewChild('btnModalPedido') btnModalPedido!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnModalDetalle') btnModalDetalle!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnModalEliminar') btnModalEliminar!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Pedidos';

  clientes = [
    { id: 1, nombre: 'Juan Pérez' },
    { id: 2, nombre: 'Empresa ABC' }
  ];

  productos = [
    { id: 1, nombre: 'Camisa' },
    { id: 2, nombre: 'Zapatos' }
  ];

  monedas = [
    { codigo: 'COP', nombre: 'Peso Colombiano', simbolo: '$' },
    { codigo: 'USD', nombre: 'Dólar Americano', simbolo: 'US$' },
    { codigo: 'EUR', nombre: 'Euro', simbolo: '€' }
  ];

  filtroCliente: number = 0;
  filtroProducto: number = 0;
  filtroFecha = '';

  modalTitulo = 'Crear Pedido';
  editId: number | null = null;

  pedidoDetalle: PedidoModel | null = null;
  pedidoEliminar: PedidoModel | null = null;
  observacionEliminar = '';

  form: PedidoForm = this.resetForm();
  pedidos: PedidoModel[] = [];

  get pedidosFiltrados(): PedidoModel[] {
    return this.pedidos.filter(p =>
      (!this.filtroCliente || p.idCliente === this.filtroCliente) &&
      (!this.filtroProducto || p.idProducto === this.filtroProducto) &&
      (!this.filtroFecha || p.fechaCreacion === this.filtroFecha)
    );
  }

  calcularTotales() {
    const cantidad = Number(this.form.cantidad) || 0;
    const precio = Number(this.form.precioUnitario) || 0;
    const descuento = Number(this.form.descuento) || 0;
  
    this.form.subtotal = cantidad * precio;
    this.form.total = this.form.subtotal - descuento;
  }

  abrirNuevo() {
    this.modalTitulo = 'Crear Pedido';
    this.editId = null;
    this.form = this.resetForm();
    this.triggerModal(this.btnModalPedido);
  }

  abrirEditar(p: PedidoModel) {
    this.modalTitulo = 'Editar Pedido';
    this.editId = p.id;

    this.form = {
      idCliente: p.idCliente,
      idProducto: p.idProducto,
      moneda: p.moneda,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      medidas: p.medidas,
      descuento: p.descuento,
      precioUnitario: p.precioUnitario,
      subtotal: p.subtotal,
      total: p.total
    };

    this.triggerModal(this.btnModalPedido);
  }

  verDetalle(p: PedidoModel) {
    this.pedidoDetalle = p;
    this.triggerModal(this.btnModalDetalle);
  }

  confirmarEliminar(p: PedidoModel) {
    this.pedidoEliminar = p;
    this.observacionEliminar = '';
    this.triggerModal(this.btnModalEliminar);
  }

  eliminar() {
    if (!this.pedidoEliminar) return;

    this.pedidoEliminar.estado = 'Cancelado';
    this.pedidoEliminar.observacionEliminacion = this.observacionEliminar;

    this.cerrarModal('modalEliminar');
  }

  guardar() {

    if (
      this.form.idCliente === 0 ||
      this.form.idProducto === 0 ||
      this.form.moneda === ''
    ) {
      alert('Debe completar los campos obligatorios');
      return;
    }

    this.calcularTotales();

    const monedaSel = this.monedas.find(m => m.codigo === this.form.moneda);

    if (this.editId !== null) {

      const index = this.pedidos.findIndex(p => p.id === this.editId);

      if (index !== -1) {
        this.pedidos[index] = {
          ...this.pedidos[index],
          ...this.form,
          clienteNombre: this.obtenerNombre(this.clientes, this.form.idCliente),
          productoNombre: this.obtenerNombre(this.productos, this.form.idProducto),
          simboloMoneda: monedaSel?.simbolo || '$'
        };
      }

    } else {

      const nuevoId = this.pedidos.length > 0
        ? Math.max(...this.pedidos.map(p => p.id)) + 1
        : 1;

      this.pedidos.push({
        id: nuevoId,
        ...this.form,
        clienteNombre: this.obtenerNombre(this.clientes, this.form.idCliente),
        productoNombre: this.obtenerNombre(this.productos, this.form.idProducto),
        simboloMoneda: monedaSel?.simbolo || '$',
        estado: 'Pendiente',
        usuarioCreacion: 'Usuario Sistema',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal('modalPedido');
  }

  resetForm(): PedidoForm {
    return {
      idCliente: 0,
      idProducto: 0,
      moneda: '',
      descripcion: '',
      cantidad: 1,
      medidas: '',
      descuento: 0,
      precioUnitario: 0,
      subtotal: 0,
      total: 0
    };
  }

  obtenerNombre(lista: any[], id: number): string {
    return lista.find(x => x.id === id)?.nombre || '';
  }

  private triggerModal(btn: ElementRef<HTMLButtonElement>) {
    setTimeout(() => btn?.nativeElement.click(), 0);
  }

  cerrarModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const inst = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (inst) inst.hide();
    }
  }
}