import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PedidoPantalla {
  id: number;
  idPedido: number;
  idCliente: number;
  clienteNombre: string;
  idProducto: number;
  productoNombre: string;
  idTipoMoneda: number;
  moneda: string;
  simboloMoneda: string;
  descripcion: string;
  cantidad: number;
  idUnidadMedida?: number;
  unidadMedidaNombre?: string;
  medidas: string;
  descuento: number;
  precioUnitario: number;
  subtotal: number;
  total: number;
  estadoCodigo: number;
  estado: 'Pendiente' | 'En proceso' | 'En proceso de envío' | 'Entregado' | 'Cancelado';
  usuarioCreacion: string;
  fechaCreacion: string;
  observacionEliminacion?: string;
  fechaEntrega?: string;
  entregadoPorTexto?: string;
  recibidoPor?: string;
}

export interface PedidoEstadoUpdateBody {
  estado: number;
  fechaEntrega?: string;
  recibidoPor?: string;
  entregadoPorUsuarioId?: number | null;
}

export interface PedidoCreateBody {
  idCliente: number;
  idTipoMoneda: number;
  idProducto: number;
  idUnidadMedida: number;
  descripcion?: string;
  cantidad: number;
  medidas?: string;
  descuento: number;
  precioUnitario: number;
  total: number;
}

export interface PedidoDetalleUpdateBody {
  idCliente: number;
  idTipoMoneda: number;
  idProducto: number;
  idUnidadMedida: number;
  descripcion?: string;
  cantidad: number;
  medidas?: string;
  descuento: number;
  precioUnitario: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class PedidosApiService {
  private readonly base = `${environment.apiUrl}/pedidos`;

  constructor(private http: HttpClient) {}

  pedidosList(): Observable<PedidoPantalla[]> {
    return this.http.get<PedidoPantalla[]>(this.base);
  }

  pedidoCreate(body: PedidoCreateBody): Observable<PedidoPantalla> {
    return this.http.post<PedidoPantalla>(this.base, body);
  }

  pedidoDetalleUpdate(idDetalle: number, body: PedidoDetalleUpdateBody): Observable<PedidoPantalla> {
    return this.http.patch<PedidoPantalla>(`${this.base}/detalle/${idDetalle}`, body);
  }

  pedidoCancelar(idPedido: number, body: { observacion: string }): Observable<PedidoPantalla[]> {
    return this.http.patch<PedidoPantalla[]>(`${this.base}/${idPedido}/cancelar`, body);
  }

  pedidoEstadoUpdate(idPedido: number, body: PedidoEstadoUpdateBody): Observable<PedidoPantalla[]> {
    return this.http.patch<PedidoPantalla[]>(`${this.base}/${idPedido}/estado`, body);
  }
}
