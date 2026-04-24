import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import {
  PedidosApiService,
  type PedidoEstadoUpdateBody,
  type PedidoPantalla,
} from '../../../core/services/pedidos-api.service';
import { ClientesApiService, type ClienteApi } from '../../../core/services/clientes-api.service';
import {
  ProductosApiService,
  type CatalogoProductoPantalla,
  type ProductoPantalla,
} from '../../../core/services/productos-api.service';
import { UsuariosService, type UsuarioApi } from '../../../core/services/usuarios.service';
import {
  validarPedidoCantidadCreacion,
  validarPedidoDescripcion,
  validarPedidoDescuentoPorcentaje,
  validarPedidoMotivoCancelacion,
  validarPedidoPrecioUnitarioCreacion,
} from '@lib/validaciones';

export type PedidoModel = PedidoPantalla;

interface PedidoForm {
  idCliente: number;
  idProducto: number;
  idTipoMoneda: number;
  idUnidadMedida: number;
  descripcion: string;
  cantidad: number;
  descuentoPorcentaje: number;
  precioUnitario: number;
  subtotal: number;
  valorDescuento: number;
  total: number;
}

function simboloPorNombreMoneda(nombre: string): string {
  const t = String(nombre || '').trim().toUpperCase();
  if (t === 'USD') return 'US$';
  if (t === 'EUR') return '€';
  return '$';
}

function etiquetaCliente(c: ClienteApi): string {
  const rz = (c.razonSocial || '').trim();
  if (rz) return rz;
  const nc = (c.nombreComercial || '').trim();
  if (nc) return nc;
  return `${c.nombre || ''} ${c.apellidos || ''}`.trim() || `Cliente #${c.id}`;
}

interface UnidadSelect {
  id: number;
  nombre: string;
  estadoActivo: boolean;
}

type BootstrapModalInstance = { show: () => void; hide: () => void };

type BootstrapModalStatic = {
  new (el: HTMLElement, opts?: { backdrop?: boolean | 'static'; keyboard?: boolean }): BootstrapModalInstance;
  getOrCreateInstance: (
    el: HTMLElement,
    opts?: { backdrop?: boolean | 'static'; keyboard?: boolean }
  ) => BootstrapModalInstance;
};

function getBootstrapModal(): BootstrapModalStatic | undefined {
  return (window as unknown as { bootstrap?: { Modal: BootstrapModalStatic } }).bootstrap?.Modal;
}

interface FormEntregaPedido {
  fechaEntrega: string;
  recibidoPor: string;
  entregadoUsuarioId: number;
}

@Component({
  selector: 'app-crear-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-pedido.html',
  styleUrl: './crear-pedido.css',
})
export class CrearPedido implements OnInit, AfterViewInit {
  tituloModulo = 'Gestión de Pedidos';

  clientes: { id: number; nombre: string }[] = [];
  productosLista: ProductoPantalla[] = [];
  monedas: { id: number; nombre: string; codigo: string; simbolo: string }[] = [];
  unidadesMedida: UnidadSelect[] = [];
  usuariosEntrega: { id: number; nombre: string }[] = [];

  filtroTexto = '';
  filtroEstadoCodigo = 0;
  filtroFecha = '';

  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];
  paginaActual = 1;
  itemsPorPagina = 5;

  modalTitulo = 'Crear Pedido';
  editIdDetalle: number | null = null;
  modoCreacionPedido = true;
  private snapshotEdicion: string | null = null;

  pedidoDetalle: PedidoModel | null = null;
  pedidoEliminar: PedidoModel | null = null;
  motivoCancelacion = '';

  pedidoCambiarEstado: PedidoModel | null = null;
  vistaEstadoModal: 'menu' | 'entrega' = 'menu';
  formEntrega: FormEntregaPedido = {
    fechaEntrega: '',
    recibidoPor: '',
    entregadoUsuarioId: 0,
  };
  estadoCambioPending = false;
  estadoCambioError = '';

  form: PedidoForm = this.resetForm();
  pedidos: PedidoModel[] = [];

  loadPending = false;
  listLoaded = false;
  loadError = '';
  savePending = false;
  saveError = '';
  cancelPending = false;
  cancelError = '';

  constructor(
    private pedidosApi: PedidosApiService,
    private clientesApi: ClientesApiService,
    private productosApi: ProductosApiService,
    private usuariosService: UsuariosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewInit(): void {
    const Modal = getBootstrapModal();
    if (!Modal) return;
    for (const id of ['modalPedido', 'modalDetalle', 'modalEliminar', 'modalEstado']) {
      const el = document.getElementById(id);
      if (el) {
        Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false });
      }
    }
  }

  get simboloForm(): string {
    return this.monedas.find((m) => m.id === this.form.idTipoMoneda)?.simbolo ?? '$';
  }

  private estadoCodigoPedido(p: PedidoModel): number {
    const raw = Number(p.estadoCodigo);
    if (Number.isFinite(raw) && raw >= 1 && raw <= 4) return raw;
    if (p.estado === 'Pendiente') return 1;
    if (p.estado === 'En proceso' || p.estado === 'En proceso de envío') return 2;
    if (p.estado === 'Entregado') return 3;
    if (p.estado === 'Cancelado') return 4;
    return 1;
  }

  get pedidosFiltrados(): PedidoModel[] {
    const q = this.filtroTexto.trim().toLowerCase();
    return this.pedidos.filter((p) => {
      const cliente = (p.clienteNombre ?? '').toLowerCase();
      const producto = (p.productoNombre ?? '').toLowerCase();
      const cumpleTexto = !q || cliente.includes(q) || producto.includes(q);
      const cumpleEstado =
        !this.filtroEstadoCodigo || this.estadoCodigoPedido(p) === this.filtroEstadoCodigo;
      const fechaSolo = (p.fechaCreacion ?? '').trim().slice(0, 10);
      const cumpleFecha = !this.filtroFecha || fechaSolo === this.filtroFecha;
      return cumpleTexto && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.pedidosFiltrados.length / this.itemsPorPagina));
  }

  get pedidosPagina(): PedidoModel[] {
    const all = this.pedidosFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get mostrarBarraPaginacion(): boolean {
    return this.listLoaded && !this.loadError && this.pedidosFiltrados.length > 0;
  }

  get hayMultiplesPaginas(): boolean {
    return this.pedidosFiltrados.length > this.itemsPorPagina;
  }

  onFiltrosChange(): void {
    this.paginaActual = 1;
  }

  onTamanoPaginaChange(): void {
    this.paginaActual = 1;
  }

  irPagina(p: number): void {
    const t = this.totalPaginas;
    this.paginaActual = Math.min(Math.max(1, p), t);
  }

  calcularTotales(): void {
    const cantidad = Number(this.form.cantidad) || 0;
    const precio = Number(this.form.precioUnitario) || 0;
    const pct = Number(this.form.descuentoPorcentaje) || 0;
    this.form.subtotal = cantidad * precio;
    this.form.valorDescuento = (this.form.subtotal * Math.min(100, Math.max(0, pct))) / 100;
    this.form.total = this.form.subtotal - this.form.valorDescuento;
  }

  descuentoAbsolutoParaApi(): number {
    this.calcularTotales();
    return Math.round(this.form.valorDescuento * 100) / 100;
  }

  porcentajeDesdePedido(p: PedidoModel): number {
    const sub = Number(p.subtotal) || 0;
    if (sub <= 0) return 0;
    const d = Number(p.descuento) || 0;
    return Math.round((d / sub) * 10000) / 100;
  }

  cargar(): void {
    this.loadError = '';
    this.loadPending = true;
    this.cdr.detectChanges();
    forkJoin({
      pedidos: this.pedidosApi.pedidosList(),
      clientes: this.clientesApi.clientesList(),
      productos: this.productosApi.productosList(),
      monedas: this.productosApi.catalogList('tipos-moneda'),
      unidades: this.productosApi.catalogList('unidades-medida'),
      usuarios: this.usuariosService.list(),
    })
      .pipe(
        finalize(() => {
          this.loadPending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ pedidos, clientes, productos, monedas, unidades, usuarios }) => {
          this.listLoaded = true;
          this.pedidos = Array.isArray(pedidos) ? pedidos : [];
          this.clientes = (clientes || [])
            .filter((c) => c.estadoActivo)
            .map((c) => ({ id: c.id, nombre: etiquetaCliente(c) }));
          this.productosLista = (productos || []).filter((p) => p.estadoActivo);
          this.monedas = (monedas || [])
            .filter((m: CatalogoProductoPantalla) => m.estadoActivo)
            .map((m: CatalogoProductoPantalla) => ({
              id: m.id,
              nombre: m.nombre,
              codigo: m.nombre,
              simbolo: simboloPorNombreMoneda(m.nombre),
            }));
          this.unidadesMedida = (unidades || []).map((u: CatalogoProductoPantalla) => ({
            id: u.id,
            nombre: u.nombre,
            estadoActivo: u.estadoActivo,
          }));
          this.usuariosEntrega = (usuarios || [])
            .filter((u: UsuarioApi) => u.estadoActivo)
            .map((u: UsuarioApi) => ({
              id: u.id,
              nombre: `${(u.nombre || '').trim()} ${(u.apellido || '').trim()}`.trim() || `Usuario #${u.id}`,
            }));
          this.ajustarPaginaTrasFiltro();
        },
        error: (err) => {
          this.listLoaded = false;
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudieron cargar pedidos o catálogos. Verifique la sesión y la API.';
        },
      });
  }

  private ajustarPaginaTrasFiltro(): void {
    const t = this.totalPaginas;
    if (this.paginaActual > t) this.paginaActual = t;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargar();
  }

  onProductoChange(idProducto: number): void {
    if (!idProducto) {
      this.form.idUnidadMedida = 0;
      return;
    }
    const p = this.productosLista.find((x) => x.id === idProducto);
    if (!p) {
      this.form.idUnidadMedida = 0;
      return;
    }
    if (p.idUnidadMedida > 0 && this.unidadesMedida.some((u) => u.id === p.idUnidadMedida)) {
      this.form.idUnidadMedida = p.idUnidadMedida;
      return;
    }
    const nombre = (p.unidadMedidaNombre || '').trim();
    if (nombre && nombre !== '—') {
      const coincidencia = this.unidadesMedida.find(
        (u) => u.nombre.trim().toLowerCase() === nombre.toLowerCase()
      );
      if (coincidencia) {
        this.form.idUnidadMedida = coincidencia.id;
        return;
      }
    }
    this.form.idUnidadMedida = 0;
  }

  private showModal(id: string): void {
    const el = document.getElementById(id);
    const Modal = getBootstrapModal();
    if (el && Modal) {
      Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false }).show();
    }
  }

  private hideModal(id: string): void {
    const el = document.getElementById(id);
    const Modal = getBootstrapModal();
    if (el && Modal) {
      const inst = Modal.getOrCreateInstance(el, { backdrop: 'static', keyboard: false });
      inst.hide();
    }
  }

  fechaIsoHoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  cerrarModalPedido(): void {
    this.hideModal('modalPedido');
  }

  cerrarModalDetalle(): void {
    this.pedidoDetalle = null;
    this.hideModal('modalDetalle');
  }

  cerrarModalEstado(): void {
    this.vistaEstadoModal = 'menu';
    this.pedidoCambiarEstado = null;
    this.estadoCambioError = '';
    this.hideModal('modalEstado');
  }

  cerrarModalEliminar(): void {
    this.pedidoEliminar = null;
    this.motivoCancelacion = '';
    this.cancelError = '';
    this.hideModal('modalEliminar');
  }

  volverMenuEstado(): void {
    this.vistaEstadoModal = 'menu';
    this.estadoCambioError = '';
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Crear Pedido';
    this.editIdDetalle = null;
    this.modoCreacionPedido = true;
    this.snapshotEdicion = null;
    this.saveError = '';
    this.form = this.resetForm();
    this.onProductoChange(0);
    this.showModal('modalPedido');
  }

  abrirEditar(p: PedidoModel): void {
    if (!this.puedeEditarPedido(p)) return;
    this.modalTitulo = 'Editar Pedido';
    this.editIdDetalle = p.id;
    this.modoCreacionPedido = false;
    this.saveError = '';
    const pct = this.porcentajeDesdePedido(p);
    let idUm =
      p.idUnidadMedida != null && Number.isFinite(Number(p.idUnidadMedida)) && Number(p.idUnidadMedida) > 0
        ? Number(p.idUnidadMedida)
        : 0;
    if (idUm > 0 && !this.unidadesMedida.some((u) => u.id === idUm)) idUm = 0;
    if (!idUm) {
      const nombre = (p.unidadMedidaNombre ?? '').trim();
      if (nombre && nombre !== '—') {
        const coincidencia = this.unidadesMedida.find(
          (u) => u.nombre.trim().toLowerCase() === nombre.toLowerCase()
        );
        if (coincidencia) idUm = coincidencia.id;
      }
    }
    this.form = {
      idCliente: p.idCliente,
      idProducto: p.idProducto,
      idTipoMoneda: p.idTipoMoneda,
      idUnidadMedida: idUm,
      descripcion: p.descripcion ?? '',
      cantidad: p.cantidad,
      descuentoPorcentaje: pct,
      precioUnitario: p.precioUnitario,
      subtotal: p.subtotal,
      valorDescuento: p.descuento,
      total: p.total,
    };
    if (!this.form.idUnidadMedida) this.onProductoChange(p.idProducto);
    this.calcularTotales();
    this.snapshotEdicion = JSON.stringify(this.formEdicionPayload());
    this.showModal('modalPedido');
  }

  private formEdicionPayload(): Record<string, unknown> {
    return {
      idCliente: this.form.idCliente,
      idProducto: this.form.idProducto,
      idTipoMoneda: this.form.idTipoMoneda,
      idUnidadMedida: Number(this.form.idUnidadMedida),
      descripcion: this.form.descripcion.trim(),
      cantidad: Number(this.form.cantidad),
      descuentoPorcentaje: Number(this.form.descuentoPorcentaje),
      precioUnitario: Number(this.form.precioUnitario),
    };
  }

  verDetalle(p: PedidoModel): void {
    this.pedidoDetalle = p;
    this.showModal('modalDetalle');
  }

  puedeCancelarPedido(p: PedidoModel): boolean {
    const c = this.estadoCodigoPedido(p);
    return c === 1 || c === 2;
  }

  puedeEditarPedido(p: PedidoModel): boolean {
    return this.estadoCodigoPedido(p) === 1;
  }

  puedeCambiarEstadoPedido(p: PedidoModel): boolean {
    const c = this.estadoCodigoPedido(p);
    return c === 1 || c === 2;
  }

  opcionesEstadoSiguientes(p: PedidoModel): { codigo: number; etiqueta: string }[] {
    const c = this.estadoCodigoPedido(p);
    if (c === 1) {
      return [
        { codigo: 2, etiqueta: 'En proceso' },
        { codigo: 3, etiqueta: 'Entregado' },
        { codigo: 4, etiqueta: 'Cancelado' },
      ];
    }
    if (c === 2) {
      return [
        { codigo: 3, etiqueta: 'Entregado' },
        { codigo: 4, etiqueta: 'Cancelado' },
      ];
    }
    return [];
  }

  abrirCambiarEstado(p: PedidoModel): void {
    if (!this.puedeCambiarEstadoPedido(p)) return;
    this.pedidoCambiarEstado = p;
    this.vistaEstadoModal = 'menu';
    this.estadoCambioError = '';
    this.showModal('modalEstado');
  }

  onElegirOpcionEstado(codigo: number): void {
    const ped = this.pedidoCambiarEstado;
    if (!ped) return;
    if (codigo === 4) {
      this.hideModal('modalEstado');
      this.vistaEstadoModal = 'menu';
      this.pedidoCambiarEstado = null;
      this.estadoCambioError = '';
      this.confirmarEliminar(ped);
      return;
    }
    if (codigo === 3) {
      this.vistaEstadoModal = 'entrega';
      this.formEntrega = {
        fechaEntrega: this.fechaIsoHoy(),
        recibidoPor: '',
        entregadoUsuarioId: 0,
      };
      this.estadoCambioError = '';
      return;
    }
    const permitidas = this.opcionesEstadoSiguientes(ped)
      .filter((o) => o.codigo !== 4 && o.codigo !== 3)
      .map((o) => o.codigo);
    if (!permitidas.includes(codigo)) {
      this.estadoCambioError = 'Transición de estado no permitida';
      return;
    }
    this.ejecutarCambioEstadoApi(ped, { estado: codigo });
  }

  confirmarEntregaPedido(): void {
    const ped = this.pedidoCambiarEstado;
    if (!ped) return;
    const rec = this.formEntrega.recibidoPor.trim();
    if (!this.formEntrega.fechaEntrega) {
      this.estadoCambioError = 'La fecha de entrega es obligatoria';
      return;
    }
    if (rec.length < 2) {
      this.estadoCambioError = 'El campo recibido por es obligatorio';
      return;
    }
    if (!this.formEntrega.entregadoUsuarioId) {
      this.estadoCambioError = 'Seleccione el usuario que entrega';
      return;
    }
    this.ejecutarCambioEstadoApi(ped, {
      estado: 3,
      fechaEntrega: this.formEntrega.fechaEntrega,
      recibidoPor: rec,
      entregadoPorUsuarioId: this.formEntrega.entregadoUsuarioId,
    });
  }

  private ejecutarCambioEstadoApi(ped: PedidoModel, body: PedidoEstadoUpdateBody): void {
    this.estadoCambioPending = true;
    this.estadoCambioError = '';
    this.cdr.detectChanges();
    this.pedidosApi.pedidoEstadoUpdate(ped.idPedido, body).subscribe({
      next: (rows) => {
        this.estadoCambioPending = false;
        this.fusionarFilasPedido(ped.idPedido, rows);
        this.pedidoCambiarEstado = null;
        this.vistaEstadoModal = 'menu';
        this.hideModal('modalEstado');
        this.ajustarPaginaTrasFiltro();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.estadoCambioPending = false;
        const msg = err?.error?.message;
        this.estadoCambioError = typeof msg === 'string' ? msg : 'No se pudo actualizar el estado.';
        this.cdr.detectChanges();
      },
    });
  }

  private fusionarFilasPedido(idPedido: number, nuevas: PedidoPantalla[]): void {
    this.pedidos = this.pedidos.filter((x) => x.idPedido !== idPedido).concat(nuevas);
    this.pedidos.sort((a, b) => {
      const fa = (a.fechaCreacion ?? '').slice(0, 10);
      const fb = (b.fechaCreacion ?? '').slice(0, 10);
      if (fa !== fb) return fb.localeCompare(fa);
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }

  confirmarEliminar(p: PedidoModel): void {
    if (!this.puedeCancelarPedido(p)) return;
    this.pedidoEliminar = p;
    this.motivoCancelacion = '';
    this.cancelError = '';
    this.showModal('modalEliminar');
  }

  eliminar(): void {
    if (!this.pedidoEliminar) return;
    const v = validarPedidoMotivoCancelacion(this.motivoCancelacion);
    if (!v.valido) {
      this.cancelError = v.mensaje;
      return;
    }
    this.cancelPending = true;
    this.cancelError = '';
    this.cdr.detectChanges();
    this.pedidosApi
      .pedidoCancelar(this.pedidoEliminar.idPedido, { observacion: this.motivoCancelacion.trim() })
      .subscribe({
        next: (rows) => {
          this.cancelPending = false;
          this.fusionarFilasPedido(this.pedidoEliminar!.idPedido, rows);
          this.pedidoEliminar = null;
          this.motivoCancelacion = '';
          this.cerrarModalEliminar();
          this.ajustarPaginaTrasFiltro();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cancelPending = false;
          const msg = err?.error?.message;
          this.cancelError = typeof msg === 'string' ? msg : 'No se pudo cancelar el pedido.';
          this.cdr.detectChanges();
        },
      });
  }

  private validarFormularioCreacion(): boolean {
    if (this.form.idCliente === 0) {
      this.saveError = 'El campo Cliente es obligatorio';
      return false;
    }
    if (this.form.idProducto === 0) {
      this.saveError = 'El campo Producto es obligatorio';
      return false;
    }
    if (this.form.idTipoMoneda === 0) {
      this.saveError = 'El campo Moneda es obligatorio';
      return false;
    }
    if (!this.form.idUnidadMedida) {
      this.saveError = 'Seleccione una unidad de medida';
      return false;
    }
    const cant = validarPedidoCantidadCreacion(String(this.form.cantidad ?? ''));
    if (!cant.valido) {
      this.saveError = cant.mensaje;
      return false;
    }
    const prec = validarPedidoPrecioUnitarioCreacion(this.form.precioUnitario);
    if (!prec.valido) {
      this.saveError = prec.mensaje;
      return false;
    }
    const d = validarPedidoDescuentoPorcentaje(this.form.descuentoPorcentaje);
    if (!d.valido) {
      this.saveError = d.mensaje;
      return false;
    }
    const obs = validarPedidoDescripcion(this.form.descripcion);
    if (!obs.valido) {
      this.saveError = obs.mensaje;
      return false;
    }
    return true;
  }

  private validarFormularioEdicion(): boolean {
    if (
      this.form.idCliente === 0 ||
      this.form.idProducto === 0 ||
      this.form.idTipoMoneda === 0 ||
      !this.form.idUnidadMedida
    ) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return false;
    }
    const cant = validarPedidoCantidadCreacion(String(this.form.cantidad ?? ''));
    if (!cant.valido) {
      this.saveError = cant.mensaje;
      return false;
    }
    const prec = validarPedidoPrecioUnitarioCreacion(this.form.precioUnitario);
    if (!prec.valido) {
      this.saveError = prec.mensaje;
      return false;
    }
    const d = validarPedidoDescuentoPorcentaje(this.form.descuentoPorcentaje);
    if (!d.valido) {
      this.saveError = d.mensaje;
      return false;
    }
    const obs = validarPedidoDescripcion(this.form.descripcion);
    if (!obs.valido) {
      this.saveError = obs.mensaje;
      return false;
    }
    return true;
  }

  guardar(): void {
    this.saveError = '';
    this.calcularTotales();

    if (this.modoCreacionPedido) {
      if (!this.validarFormularioCreacion()) return;
    } else {
      if (!this.validarFormularioEdicion()) return;
      if (JSON.stringify(this.formEdicionPayload()) === this.snapshotEdicion) {
        this.saveError = 'No se detectaron cambios en la información';
        return;
      }
    }

    const descAbs = this.descuentoAbsolutoParaApi();
    const body = {
      idCliente: this.form.idCliente,
      idTipoMoneda: this.form.idTipoMoneda,
      idProducto: this.form.idProducto,
      idUnidadMedida: Number(this.form.idUnidadMedida),
      descripcion: this.form.descripcion.trim(),
      cantidad: Number(this.form.cantidad),
      medidas: '',
      descuento: descAbs,
      precioUnitario: Number(this.form.precioUnitario),
      total: Math.max(0, Math.round(this.form.total * 100) / 100),
    };

    this.savePending = true;
    this.cdr.detectChanges();

    if (this.editIdDetalle != null) {
      this.pedidosApi
        .pedidoDetalleUpdate(this.editIdDetalle, body)
        .pipe(
          finalize(() => {
            this.savePending = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (saved) => {
            const ix = this.pedidos.findIndex((x) => x.id === saved.id);
            if (ix >= 0) this.pedidos[ix] = saved;
            this.pedidos = [...this.pedidos];
            this.editIdDetalle = null;
            this.cerrarModalPedido();
          },
          error: (err) => {
            const msg = err?.error?.message;
            this.saveError = typeof msg === 'string' ? msg : 'No se pudo guardar.';
          },
        });
      return;
    }

    this.pedidosApi
      .pedidoCreate(body)
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.editIdDetalle = null;
          this.cerrarModalPedido();
          this.paginaActual = 1;
          this.cargar();
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.saveError = typeof msg === 'string' ? msg : 'No se pudo crear el pedido.';
        },
      });
  }

  resetForm(): PedidoForm {
    return {
      idCliente: 0,
      idProducto: 0,
      idTipoMoneda: 0,
      idUnidadMedida: 0,
      descripcion: '',
      cantidad: 1,
      descuentoPorcentaje: 0,
      precioUnitario: 0,
      subtotal: 0,
      valorDescuento: 0,
      total: 0,
    };
  }
}
