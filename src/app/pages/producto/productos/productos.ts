import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs';
import { ProductosApiService, type ProductoPantalla } from '../../../core/services/productos-api.service';
import {
  validarProductoCodigoCreacion,
  validarProductoCodigoUnicoEnListado,
  validarProductoCategoriaCreacion,
  validarProductoNombreCreacion,
  validarProductoDescripcionCreacion,
  validarProductoCodigoContenido,
  validarProductoCategoriaContenido,
  validarProductoNombreContenido,
  validarProductoDescripcionContenido,
} from '@lib/validaciones';

export type ProductoModel = ProductoPantalla;

type BootstrapModal = { show: () => void; hide: () => void };

type FormInicialSnapshot = {
  codigo: string;
  idCategoria: string;
  nombre: string;
  descripcion: string;
};

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit {
  tituloModulo = 'Gestión de Productos';

  categoriasSelect: { id: number; nombre: string }[] = [];

  filtroBusqueda = '';
  filtroEstado = '';
  filtroFecha = '';

  modalTitulo = 'Creación de Producto';
  editId: number | null = null;
  private formInicial: FormInicialSnapshot | null = null;

  form = this.resetForm();

  productoDetalle: ProductoModel | null = null;

  productos: ProductoModel[] = [];
  loadPending = false;
  listLoaded = false;
  loadError = '';
  savePending = false;
  saveError = '';
  accionId: number | null = null;
  actionError = '';

  paginaActual = 1;
  itemsPorPagina = 5;
  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];

  readonly maxCodigo = 50;
  readonly maxNombre = 200;
  readonly maxDescripcion = 200;

  private readonly modalBootstrapOpts = { backdrop: 'static', keyboard: false } as const;

  constructor(
    private api: ProductosApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get esCreacion(): boolean {
    return this.editId === null;
  }

  get sinRegistros(): boolean {
    return this.listLoaded && !this.loadPending && !this.loadError && this.productos.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.productos.length > 0 &&
      this.productosFiltrados.length === 0
    );
  }

  get productosFiltrados(): ProductoModel[] {
    const q = this.filtroBusqueda.trim().toLowerCase();
    return this.productos.filter((p) => {
      const cumpleBusqueda =
        !q ||
        p.codigo.toLowerCase().includes(q) ||
        p.nombre.toLowerCase().includes(q);
      const cumpleEstado = !this.filtroEstado || p.estado === this.filtroEstado;
      const fechaT = (p.fechaCreacion ?? '').trim();
      const fechaSolo = fechaT.length >= 10 ? fechaT.slice(0, 10) : fechaT;
      const cumpleFecha = !this.filtroFecha || fechaSolo === this.filtroFecha;
      return cumpleBusqueda && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.itemsPorPagina));
  }

  get productosFiltradosPaginados(): ProductoModel[] {
    const all = this.productosFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.productosFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.productosFiltrados.length > 0;
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
    const t = Math.max(1, Math.ceil(this.productosFiltrados.length / this.itemsPorPagina));
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
    this.cdr.detectChanges();
    forkJoin({
      cats: this.api.catalogList('categorias-producto'),
      prods: this.api.productosList(),
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
        next: ({ cats, prods }) => {
          this.categoriasSelect = (cats || [])
            .filter((c) => c.estadoActivo)
            .map((c) => ({ id: c.id, nombre: c.nombre }));
          this.productos = Array.isArray(prods) ? prods : [];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudieron cargar productos o categorías. Verifique la sesión y la API.';
        },
      });
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargar();
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Producto';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = this.resetForm();
    setTimeout(() => this.showModal('modalProductoForm'), 0);
  }

  abrirEditar(producto: ProductoModel): void {
    this.modalTitulo = 'Edición de Producto';
    this.editId = producto.id;
    this.saveError = '';
    this.form = {
      codigo: producto.codigo,
      idCategoria: producto.idCategoria != null ? String(producto.idCategoria) : '',
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
    };
    this.formInicial = {
      codigo: producto.codigo.trim(),
      idCategoria: producto.idCategoria != null ? String(producto.idCategoria) : '',
      nombre: producto.nombre.trim(),
      descripcion: String(producto.descripcion ?? '').trim(),
    };
    setTimeout(() => this.showModal('modalProductoForm'), 0);
  }

  abrirDetalle(producto: ProductoModel): void {
    this.productoDetalle = producto;
    this.saveError = '';
    setTimeout(() => this.showModal('modalProductoDetalle'), 0);
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalProductoForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalProductoDetalle');
    this.productoDetalle = null;
  }

  guardar(): void {
    this.saveError = '';

    if (this.editId != null) {
      this.guardarEdicion();
      return;
    }

    const vC = validarProductoCodigoCreacion(this.form.codigo);
    if (!vC.valido) {
      this.saveError = vC.mensaje;
      return;
    }
    const vU = validarProductoCodigoUnicoEnListado(this.productos, this.form.codigo, null);
    if (!vU.valido) {
      this.saveError = vU.mensaje;
      return;
    }
    const vCat = validarProductoCategoriaCreacion(this.form.idCategoria);
    if (!vCat.valido) {
      this.saveError = vCat.mensaje;
      return;
    }
    const vN = validarProductoNombreCreacion(this.form.nombre);
    if (!vN.valido) {
      this.saveError = vN.mensaje;
      return;
    }
    const vD = validarProductoDescripcionCreacion(this.form.descripcion);
    if (!vD.valido) {
      this.saveError = vD.mensaje;
      return;
    }

    const idCategoriaNum = Number(this.form.idCategoria);
    const nombre = this.form.nombre.trim();
    const descripcion = this.form.descripcion.trim();

    this.savePending = true;
    this.cdr.detectChanges();

    this.api
      .productoCreate({
        codigo: this.form.codigo.trim(),
        idCategoria: idCategoriaNum,
        nombre,
        descripcion: descripcion || undefined,
      })
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved) => {
          this.productos = [...this.productos, saved];
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.sincronizar();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorGuardado(err);
        },
      });
  }

  private guardarEdicion(): void {
    const id = this.editId!;
    const f = this.form;
    const codigoT = f.codigo.trim();
    const nombreT = f.nombre.trim();
    const descT = f.descripcion.trim();
    const catT = String(f.idCategoria ?? '').trim();

    if (!codigoT || !nombreT || !descT || !catT) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return;
    }

    if (
      codigoT === this.formInicial?.codigo &&
      catT === this.formInicial?.idCategoria &&
      nombreT === this.formInicial?.nombre &&
      descT === this.formInicial?.descripcion
    ) {
      this.saveError = 'No se detectaron cambios en la información';
      return;
    }

    const vCod = validarProductoCodigoContenido(f.codigo);
    if (!vCod.valido) {
      this.saveError = vCod.mensaje;
      return;
    }
    const vUni = validarProductoCodigoUnicoEnListado(this.productos, f.codigo, id);
    if (!vUni.valido) {
      this.saveError = vUni.mensaje;
      return;
    }
    const vCat = validarProductoCategoriaContenido(f.idCategoria);
    if (!vCat.valido) {
      this.saveError = vCat.mensaje;
      return;
    }
    const vNom = validarProductoNombreContenido(f.nombre);
    if (!vNom.valido) {
      this.saveError = vNom.mensaje;
      return;
    }
    const vDesc = validarProductoDescripcionContenido(f.descripcion);
    if (!vDesc.valido) {
      this.saveError = vDesc.mensaje;
      return;
    }

    const idCategoriaNum = Number(f.idCategoria);

    this.savePending = true;
    this.cdr.detectChanges();

    this.api
      .productoUpdate(id, {
        codigo: codigoT,
        idCategoria: idCategoriaNum,
        nombre: nombreT,
        descripcion: descT || undefined,
      })
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved) => {
          const ix = this.productos.findIndex((p) => p.id === saved.id);
          if (ix >= 0) this.productos[ix] = saved;
          this.productos = [...this.productos];
          this.editId = null;
          this.formInicial = null;
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.sincronizar();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorGuardado(err);
        },
      });
  }

  private mensajeErrorGuardado(err: unknown): string {
    const status = (err as { status?: number })?.status;
    if (status === 409) return 'Este código de producto ya está registrado';
    const msg = (err as { error?: { message?: string } })?.error?.message;
    return typeof msg === 'string' ? msg : 'No se pudo guardar. Intente nuevamente.';
  }

  activarDesactivar(producto: ProductoModel): void {
    this.actionError = '';
    if (this.accionId != null) return;
    this.accionId = producto.id;
    this.cdr.detectChanges();
    this.api
      .productoUpdate(producto.id, { estadoActivo: !producto.estadoActivo })
      .pipe(
        finalize(() => {
          this.accionId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const ix = this.productos.findIndex((p) => p.id === producto.id);
          if (ix >= 0) this.productos[ix] = updated;
          this.productos = [...this.productos];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.actionError =
            typeof msg === 'string' ? msg : 'No se pudo cambiar el estado. Intente nuevamente.';
        },
      });
  }

  resetForm() {
    return {
      codigo: '',
      idCategoria: '',
      nombre: '',
      descripcion: '',
    };
  }

  private sincronizar(): void {
    forkJoin({
      cats: this.api.catalogList('categorias-producto'),
      prods: this.api.productosList(),
    }).subscribe({
      next: ({ cats, prods }) => {
        this.categoriasSelect = (cats || [])
          .filter((c) => c.estadoActivo)
          .map((c) => ({ id: c.id, nombre: c.nombre }));
        this.productos = Array.isArray(prods) ? prods : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
