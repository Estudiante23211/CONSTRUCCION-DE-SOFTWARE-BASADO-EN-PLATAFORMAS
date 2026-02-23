import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pedido {
  id: number;
  cliente: string;
  estado: 'Pendiente' | 'En proceso de envío' | 'Entregado' | 'Cancelado';
}

interface SolicitudEntregaModel {
  id: number;
  idPedido: number;
  cliente: string;

  fechaEstimada: string | null;
  fechaSalida: string | null;
  fechaEntrega: string | null;

  entregadoPor: string | null;
  recibidoPor: string | null;
  documentoRecibe: string | null;

  observacion: string | null;

  estado: 'Pendiente' | 'En ruta' | 'Entregado' | 'Cancelado';

  usuarioCreacion: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-solicitud-entrega',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-entrega.html',
  styleUrl: './solicitud-entrega.css',
})
export class SolicitudEntrega {

  @ViewChild('btnModalCrear') btnModalCrear!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnModalDespacho') btnModalDespacho!: ElementRef<HTMLButtonElement>;
  @ViewChild('btnModalEntrega') btnModalEntrega!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Solicitudes de Entrega';

  pedidos: Pedido[] = [
    { id: 1, cliente: 'Juan Pérez', estado: 'Pendiente' },
    { id: 2, cliente: 'Empresa ABC', estado: 'Pendiente' }
  ];

  solicitudes: SolicitudEntregaModel[] = [];

  formCrear = {
    idPedido: 0,
    fechaEstimada: '',
    observacion: ''
  };

  solicitudSeleccionada!: SolicitudEntregaModel;

  get pedidosDisponibles() {
    return this.pedidos.filter(p =>
      p.estado === 'Pendiente' &&
      !this.solicitudes.some(s => s.idPedido === p.id && s.estado !== 'Cancelado')
    );
  }

  abrirCrear() {
    this.formCrear = {
      idPedido: 0,
      fechaEstimada: '',
      observacion: ''
    };
    setTimeout(() => this.btnModalCrear.nativeElement.click(), 0);
  }

  guardarSolicitud() {

    if (!this.formCrear.idPedido) {
      alert('Seleccione un pedido');
      return;
    }

    const pedido = this.pedidos.find(p => p.id === this.formCrear.idPedido);
    if (!pedido) return;

    const nueva: SolicitudEntregaModel = {
      id: this.solicitudes.length + 1,
      idPedido: pedido.id,
      cliente: pedido.cliente,

      fechaEstimada: this.formCrear.fechaEstimada || null,
      fechaSalida: null,
      fechaEntrega: null,

      entregadoPor: null,
      recibidoPor: null,
      documentoRecibe: null,

      observacion: this.formCrear.observacion || null,

      estado: 'Pendiente',

      usuarioCreacion: 'Usuario Sistema',
      fechaCreacion: new Date().toISOString().slice(0, 10)
    };

    this.solicitudes.push(nueva);
    pedido.estado = 'En proceso de envío';

    this.cerrarModal('modalCrear');
  }

  abrirDespacho(s: SolicitudEntregaModel) {
    this.solicitudSeleccionada = s;
    setTimeout(() => this.btnModalDespacho.nativeElement.click(), 0);
  }

  confirmarDespacho(entregadoPor: string) {

    if (!entregadoPor.trim()) {
      alert('Ingrese quién entrega');
      return;
    }

    this.solicitudSeleccionada.entregadoPor = entregadoPor;
    this.solicitudSeleccionada.fechaSalida = new Date().toISOString();
    this.solicitudSeleccionada.estado = 'En ruta';

    this.cerrarModal('modalDespacho');
  }

  abrirEntrega(s: SolicitudEntregaModel) {
    this.solicitudSeleccionada = s;
    setTimeout(() => this.btnModalEntrega.nativeElement.click(), 0);
  }

  confirmarEntrega(recibidoPor: string, documento: string) {

    if (!recibidoPor.trim() || !documento.trim()) {
      alert('Complete los datos de quien recibe');
      return;
    }

    this.solicitudSeleccionada.recibidoPor = recibidoPor;
    this.solicitudSeleccionada.documentoRecibe = documento;
    this.solicitudSeleccionada.fechaEntrega = new Date().toISOString();
    this.solicitudSeleccionada.estado = 'Entregado';

    const pedido = this.pedidos.find(p => p.id === this.solicitudSeleccionada.idPedido);
    if (pedido) {
      pedido.estado = 'Entregado';
    }

    this.cerrarModal('modalEntrega');
  }

  cancelarSolicitud(s: SolicitudEntregaModel) {
    s.estado = 'Cancelado';

    const pedido = this.pedidos.find(p => p.id === s.idPedido);
    if (pedido) pedido.estado = 'Pendiente';
  }

  cerrarModal(id: string) {
    const modalEl = document.getElementById(id);
    const modal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
    modal?.hide();
  }
}