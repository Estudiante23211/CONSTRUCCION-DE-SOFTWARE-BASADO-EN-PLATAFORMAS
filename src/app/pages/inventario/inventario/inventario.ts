import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { InventarioApiService, type InventarioPantalla } from '../../../core/services/inventario-api.service';
import { ProductosApiService } from '../../../core/services/productos-api.service';
import { contieneSQLInjection } from '@lib/validaciones';

interface ProductoSelect {
  id: number;
  nombre: string;
}

interface UnidadSelect {
  id: number;
  nombre: string;
}

type InventarioModel = InventarioPantalla;

type FormInventario = {
  idProducto: number;
  idUnidadMedida: number;
  cantidadInicial: number | null;
  cantidadActual: number | null;
  alertaMinima: number | null;
};

type FormInventarioSnapshot = {
  idProducto: number;
  idUnidadMedida: number;
  cantidadInicial: number;
  cantidadActual: number;
  alertaMinima: number;
};

type BootstrapModal = { show: () => void; hide: () => void };

const MSG_SQL = 'El texto contiene patrones no permitidos por seguridad';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class Inventario implements OnInit {
  tituloModulo = 'Gestión de Inventario';

  productos: ProductoSelect[] = [];
  unidadesMedida: UnidadSelect[] = [];

  filtroProducto: number = 0;
  filtroEstado: string = '';
  filtroFecha: string = '';

  inventarios: InventarioModel[] = [];
  loadPending = false;
  listLoaded = false;
  loadError = '';
  savePending = false;
  saveError = '';

  paginaActual = 1;
  itemsPorPagina = 5;
  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];

  editId: number | null = null;
  modalTitulo = 'Creación de Inventario';

  inventarioDetalle: InventarioModel | null = null;

  form: FormInventario = this.resetForm();
  private formInicial: FormInventarioSnapshot | null = null;

  readonly maxDigitosCantidad = 10;

  private readonly modalBootstrapOpts = { backdrop: 'static', keyboard: false } as const;

  constructor(
    private inventarioApi: InventarioApiService,
    private productosApi: ProductosApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get esCreacion(): boolean {
    return this.editId === null;
  }

  get inventariosFiltrados(): InventarioModel[] {
    return this.inventarios.filter((i) => {
      const fechaSolo =
        (i.fechaCreacion ?? '').length >= 10 ? (i.fechaCreacion ?? '').slice(0, 10) : (i.fechaCreacion ?? '');
      return (
        (!this.filtroProducto || i.idProducto === this.filtroProducto) &&
        (!this.filtroEstado || i.estado === this.filtroEstado) &&
        (!this.filtroFecha || fechaSolo === this.filtroFecha)
      );
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.inventariosFiltrados.length / this.itemsPorPagina));
  }

  get inventariosFiltradosPaginados(): InventarioModel[] {
    const all = this.inventariosFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.inventariosFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.inventariosFiltrados.length > 0;
  }

  get sinRegistros(): boolean {
    return this.listLoaded && !this.loadPending && !this.loadError && this.inventarios.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.inventarios.length > 0 &&
      this.inventariosFiltrados.length === 0
    );
  }

  contadorDigitos(v: number | null | undefined): number {
    if (v == null || (typeof v === 'number' && Number.isNaN(v))) return 0;
    const s = String(Math.trunc(Math.abs(Number(v))));
    return s === 'NaN' ? 0 : s.length;
  }

  onFiltrosCambiados(): void {
    this.paginaActual = 1;
    this.sincronizarPaginaConTotal();
    this.cdr.detectChanges();
  }

  onTamanoPaginaChange(): void {
    this.paginaActual = 1;
    this.sincronizarPaginaConTotal();
    this.cdr.detectChanges();
  }

  irPagina(p: number): void {
    const t = this.totalPaginas;
    this.paginaActual = Math.min(Math.max(1, p), t);
    this.cdr.detectChanges();
  }

  private sincronizarPaginaConTotal(): void {
    const t = Math.max(1, Math.ceil(this.inventariosFiltrados.length / this.itemsPorPagina));
    if (this.paginaActual > t) this.paginaActual = t;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  private getBootstrapModal(modalId: string): BootstrapModal | null {
    const el = document.getElementById(modalId);
    if (!el) return null;
    const Modal = (
      window as unknown as {
        bootstrap?: {
          Modal: {
            getOrCreateInstance: (element: Element, options?: object) => BootstrapModal;
            getInstance: (element: Element) => BootstrapModal | null;
          };
        };
      }
    ).bootstrap?.Modal;
    if (!Modal) return null;
    return Modal.getOrCreateInstance(el, { ...this.modalBootstrapOpts });
  }

  private showModal(modalId: string): void {
    this.getBootstrapModal(modalId)?.show();
  }

  private hideModal(modalId: string): void {
    const el = document.getElementById(modalId);
    if (!el) return;
    const Modal = (
      window as unknown as {
        bootstrap?: { Modal: { getInstance: (element: Element) => BootstrapModal | null } };
      }
    ).bootstrap?.Modal;
    Modal?.getInstance(el)?.hide();
  }

  fechaCreacionLegible(fecha: string): string {
    if (!fecha?.trim()) return '—';
    const raw = fecha.trim();
    const d = new Date(raw.length <= 10 ? `${raw}T12:00:00` : raw);
    if (Number.isNaN(d.getTime())) return raw;
    try {
      const fechaParte = new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
      const horaParte = new Intl.DateTimeFormat('es', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
      const tieneHoraEnTexto = raw.includes('T') || /\d{1,2}:\d{2}/.test(raw);
      if (!tieneHoraEnTexto) return fechaParte;
      return `${fechaParte} · ${horaParte}`;
    } catch {
      return raw;
    }
  }

  cargar(): void {
    this.loadError = '';
    this.loadPending = true;
    this.listLoaded = false;
    this.cdr.detectChanges();
    forkJoin({
      inventarios: this.inventarioApi.list(),
      productos: this.productosApi.productosList(),
      unidades: this.productosApi.catalogList('unidades-medida'),
    })
      .pipe(
        finalize(() => {
          this.loadPending = false;
          this.listLoaded = true;
          this.sincronizarPaginaConTotal();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ inventarios, productos, unidades }) => {
          this.inventarios = inventarios;
          this.productos = productos.map((p) => ({ id: p.id, nombre: p.nombre }));
          this.unidadesMedida = unidades.map((u) => ({ id: u.id, nombre: u.nombre }));
        },
        error: (err) => {
          const msg =
            err?.error?.message && typeof err.error.message === 'string'
              ? err.error.message
              : 'No se pudo cargar el inventario.';
          this.loadError = msg;
          this.inventarios = [];
          this.productos = [];
          this.unidadesMedida = [];
        },
      });
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargar();
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Inventario';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = this.resetForm();
    setTimeout(() => this.showModal('modalInventarioForm'), 0);
  }

  abrirEditar(i: InventarioModel): void {
    this.modalTitulo = 'Edición de Inventario';
    this.editId = i.id;
    this.saveError = '';
    this.form = {
      idProducto: i.idProducto,
      idUnidadMedida: i.idUnidadMedida,
      cantidadInicial: i.cantidadInicial,
      cantidadActual: i.cantidadActual,
      alertaMinima: i.alertaMinima,
    };
    this.formInicial = {
      idProducto: i.idProducto,
      idUnidadMedida: i.idUnidadMedida,
      cantidadInicial: i.cantidadInicial,
      cantidadActual: i.cantidadActual,
      alertaMinima: i.alertaMinima,
    };
    setTimeout(() => this.showModal('modalInventarioForm'), 0);
  }

  verDetalle(i: InventarioModel): void {
    this.inventarioDetalle = i;
    setTimeout(() => this.showModal('modalInventarioDetalle'), 0);
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalInventarioForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalInventarioDetalle');
    this.inventarioDetalle = null;
  }

  guardar(): void {
    this.saveError = '';

    if (this.editId !== null) {
      this.guardarEdicion();
      return;
    }
    this.guardarCreacion();
  }

  private guardarCreacion(): void {
    if (!this.form.idProducto || !this.form.idUnidadMedida) {
      this.saveError = 'Complete los campos obligatorios.';
      return;
    }

    const ci = this.form.cantidadInicial;
    const ca = this.form.cantidadActual;
    const al = this.form.alertaMinima;
    if (ci === null || ca === null || al === null) {
      this.saveError = 'Complete los campos obligatorios.';
      return;
    }

    const vNum = this.validarCantidadesEnterasNoNegativas(ci, ca, al);
    if (!vNum.ok) {
      this.saveError = vNum.mensaje;
      return;
    }

    const vDig = this.validarTamanoDigitos(ci, ca, al);
    if (!vDig.ok) {
      this.saveError = vDig.mensaje;
      return;
    }

    if (this.contieneSqlEnValoresNumericos(ci, ca, al)) {
      this.saveError = MSG_SQL;
      return;
    }

    this.savePending = true;
    const body = {
      idProducto: this.form.idProducto,
      idUnidadMedida: this.form.idUnidadMedida,
      cantidadInicial: ci,
      cantidadActual: ca,
      alertaMinima: al,
    };

    this.inventarioApi
      .create(body)
      .pipe(finalize(() => (this.savePending = false)))
      .subscribe({
        next: (row) => {
          this.inventarios.push(row);
          this.sincronizarPaginaConTotal();
          this.cdr.markForCheck();
          this.cerrarModalFormulario();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorHttp(err, 'No se pudo guardar.');
          this.cdr.markForCheck();
        },
      });
  }

  private guardarEdicion(): void {
    if (this.formInicial && this.mismoFormQueInicial()) {
      this.saveError = 'No se detectaron cambios en la información';
      return;
    }

    if (!this.form.idProducto || !this.form.idUnidadMedida) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return;
    }

    const ci = this.form.cantidadInicial;
    const ca = this.form.cantidadActual;
    const al = this.form.alertaMinima;
    if (ci === null || ca === null || al === null) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return;
    }

    const vNum = this.validarCantidadesEnterasNoNegativas(ci, ca, al);
    if (!vNum.ok) {
      this.saveError = vNum.mensaje;
      return;
    }

    const vDig = this.validarTamanoDigitos(ci, ca, al);
    if (!vDig.ok) {
      this.saveError = vDig.mensaje;
      return;
    }

    if (this.contieneSqlEnValoresNumericos(ci, ca, al)) {
      this.saveError = MSG_SQL;
      return;
    }

    if (this.editId === null) return;

    this.savePending = true;
    const body = {
      idProducto: this.form.idProducto,
      idUnidadMedida: this.form.idUnidadMedida,
      cantidadInicial: ci,
      cantidadActual: ca,
      alertaMinima: al,
    };

    this.inventarioApi
      .update(this.editId, body)
      .pipe(finalize(() => (this.savePending = false)))
      .subscribe({
        next: (row) => {
          const index = this.inventarios.findIndex((x) => x.id === this.editId);
          if (index !== -1) this.inventarios[index] = row;
          this.sincronizarPaginaConTotal();
          this.cdr.markForCheck();
          this.cerrarModalFormulario();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorHttp(err, 'No se pudo guardar.');
          this.cdr.markForCheck();
        },
      });
  }

  private validarTamanoDigitos(
    ci: number,
    ca: number,
    al: number
  ): { ok: true } | { ok: false; mensaje: string } {
    const max = this.maxDigitosCantidad;
    for (const [label, n] of [
      ['Cantidad inicial', ci],
      ['Cantidad actual', ca],
      ['Alerta', al],
    ] as const) {
      if (this.contadorDigitos(n) > max) {
        return {
          ok: false,
          mensaje: `${label}: use como máximo ${max} dígitos.`,
        };
      }
    }
    return { ok: true };
  }

  private validarCantidadesEnterasNoNegativas(
    ci: number,
    ca: number,
    al: number
  ): { ok: true } | { ok: false; mensaje: string } {
    for (const [label, n] of [
      ['Cantidad inicial', ci],
      ['Cantidad actual', ca],
      ['Alerta', al],
    ] as const) {
      if (!Number.isFinite(n) || Number.isNaN(n)) {
        return { ok: false, mensaje: `${label}: valor numérico inválido.` };
      }
      if (n < 0) {
        return { ok: false, mensaje: `${label}: debe ser un número entero mayor o igual a 0.` };
      }
      if (!Number.isInteger(n)) {
        return { ok: false, mensaje: `${label}: debe ser un número entero (sin decimales).` };
      }
    }
    return { ok: true };
  }

  private contieneSqlEnValoresNumericos(ci: number, ca: number, al: number): boolean {
    return [ci, ca, al].some((n) => contieneSQLInjection(String(n)));
  }

  private mismoFormQueInicial(): boolean {
    if (!this.formInicial) return false;
    const ci = this.form.cantidadInicial;
    const ca = this.form.cantidadActual;
    const al = this.form.alertaMinima;
    if (ci === null || ca === null || al === null) return false;
    return (
      this.form.idProducto === this.formInicial.idProducto &&
      this.form.idUnidadMedida === this.formInicial.idUnidadMedida &&
      ci === this.formInicial.cantidadInicial &&
      ca === this.formInicial.cantidadActual &&
      al === this.formInicial.alertaMinima
    );
  }

  private mensajeErrorHttp(err: unknown, fallback: string): string {
    const msg = err && typeof err === 'object' && 'error' in err ? (err as { error?: { message?: string } }).error?.message : undefined;
    return typeof msg === 'string' && msg.trim() ? msg : fallback;
  }

  stockBajo(i: InventarioModel): boolean {
    return i.cantidadActual <= i.alertaMinima;
  }

  private resetForm(): FormInventario {
    return {
      idProducto: 0,
      idUnidadMedida: 0,
      cantidadInicial: null,
      cantidadActual: null,
      alertaMinima: null,
    };
  }
}
