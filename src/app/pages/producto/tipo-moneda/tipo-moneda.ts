import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProductosApiService, type CatalogoProductoPantalla } from '../../../core/services/productos-api.service';
import {
  validarTipoMonedaNombreCreacion,
  validarTipoMonedaNombreUnicoEnListado,
  validarTipoMonedaDescripcionCreacion,
  validarTipoMonedaNombreContenido,
  validarTipoMonedaDescripcionContenido,
} from '@lib/validaciones';

export type TipoMonedaModel = CatalogoProductoPantalla;

type BootstrapModal = { show: () => void; hide: () => void };

type FormInicialSnapshot = { nombre: string; descripcion: string };

@Component({
  selector: 'app-tipo-moneda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-moneda.html',
  styleUrl: './tipo-moneda.css',
})
export class TipoMoneda implements OnInit {
  private readonly recurso = 'tipos-moneda' as const;

  tituloModulo = 'Gestión de Tipo de Moneda';

  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  modalTitulo = 'Creación de Tipo de Moneda';
  editId: number | null = null;
  private formInicial: FormInicialSnapshot | null = null;

  form = { nombre: '', descripcion: '' };

  tipoMonedaDetalle: TipoMonedaModel | null = null;

  tiposMoneda: TipoMonedaModel[] = [];
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
    return this.listLoaded && !this.loadPending && !this.loadError && this.tiposMoneda.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.tiposMoneda.length > 0 &&
      this.tiposMonedaFiltrados.length === 0
    );
  }

  get tiposMonedaFiltrados(): TipoMonedaModel[] {
    return this.tiposMoneda.filter((t) => {
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        t.nombre.toLowerCase().includes(this.filtroNombre.trim().toLowerCase());
      const cumpleEstado = !this.filtroEstado || t.estado === this.filtroEstado;
      const fechaT = (t.fechaCreacion ?? '').trim();
      const fechaSolo = fechaT.length >= 10 ? fechaT.slice(0, 10) : fechaT;
      const cumpleFecha = !this.filtroFecha || fechaSolo === this.filtroFecha;
      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.tiposMonedaFiltrados.length / this.itemsPorPagina));
  }

  get tiposMonedaFiltradosPaginados(): TipoMonedaModel[] {
    const all = this.tiposMonedaFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.tiposMonedaFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.tiposMonedaFiltrados.length > 0;
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
    const t = Math.max(1, Math.ceil(this.tiposMonedaFiltrados.length / this.itemsPorPagina));
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
    this.api
      .catalogList(this.recurso)
      .pipe(
        finalize(() => {
          this.loadPending = false;
          this.listLoaded = true;
          this.sincronizarPaginaConTotal();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.tiposMoneda = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cargar el catálogo. Verifique la sesión y la API.';
        },
      });
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargar();
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Tipo de Moneda';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = { nombre: '', descripcion: '' };
    setTimeout(() => this.showModal('modalTipoMonedaForm'), 0);
  }

  abrirEditar(tipo: TipoMonedaModel): void {
    this.modalTitulo = 'Edición de Tipo de Moneda';
    this.editId = tipo.id;
    this.saveError = '';
    this.form = { nombre: tipo.nombre, descripcion: tipo.descripcion ?? '' };
    this.formInicial = {
      nombre: tipo.nombre.trim(),
      descripcion: String(tipo.descripcion ?? '').trim(),
    };
    setTimeout(() => this.showModal('modalTipoMonedaForm'), 0);
  }

  abrirDetalle(tipo: TipoMonedaModel): void {
    this.tipoMonedaDetalle = tipo;
    this.saveError = '';
    setTimeout(() => this.showModal('modalTipoMonedaDetalle'), 0);
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalTipoMonedaForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalTipoMonedaDetalle');
    this.tipoMonedaDetalle = null;
  }

  guardar(): void {
    this.saveError = '';

    if (this.editId != null) {
      this.guardarEdicion();
      return;
    }

    const vN = validarTipoMonedaNombreCreacion(this.form.nombre);
    if (!vN.valido) {
      this.saveError = vN.mensaje;
      return;
    }
    const vU = validarTipoMonedaNombreUnicoEnListado(this.tiposMoneda, this.form.nombre, null);
    if (!vU.valido) {
      this.saveError = vU.mensaje;
      return;
    }
    const vD = validarTipoMonedaDescripcionCreacion(this.form.descripcion);
    if (!vD.valido) {
      this.saveError = vD.mensaje;
      return;
    }

    const nombre = this.form.nombre.trim();
    const descripcion = this.form.descripcion.trim();

    this.savePending = true;
    this.cdr.detectChanges();

    this.api
      .catalogCreate(this.recurso, {
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
          this.tiposMoneda = [...this.tiposMoneda, saved];
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
    const nombreT = f.nombre.trim();
    const descT = f.descripcion.trim();

    if (!nombreT || !descT) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return;
    }

    if (nombreT === this.formInicial?.nombre && descT === this.formInicial?.descripcion) {
      this.saveError = 'No se detectaron cambios en la información';
      return;
    }

    const vNom = validarTipoMonedaNombreContenido(f.nombre);
    if (!vNom.valido) {
      this.saveError = vNom.mensaje;
      return;
    }
    const vUni = validarTipoMonedaNombreUnicoEnListado(this.tiposMoneda, f.nombre, id);
    if (!vUni.valido) {
      this.saveError = vUni.mensaje;
      return;
    }
    const vDesc = validarTipoMonedaDescripcionContenido(f.descripcion);
    if (!vDesc.valido) {
      this.saveError = vDesc.mensaje;
      return;
    }

    this.savePending = true;
    this.cdr.detectChanges();

    this.api
      .catalogPatch(this.recurso, id, {
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
          const ix = this.tiposMoneda.findIndex((t) => t.id === saved.id);
          if (ix >= 0) this.tiposMoneda[ix] = saved;
          this.tiposMoneda = [...this.tiposMoneda];
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
    if (status === 409) return 'Este tipo de moneda ya está creado';
    const msg = (err as { error?: { message?: string } })?.error?.message;
    return typeof msg === 'string' ? msg : 'No se pudo guardar. Intente nuevamente.';
  }

  activarDesactivar(tipo: TipoMonedaModel): void {
    this.actionError = '';
    if (this.accionId != null) return;
    this.accionId = tipo.id;
    this.cdr.detectChanges();
    this.api
      .catalogPatch(this.recurso, tipo.id, { estadoActivo: !tipo.estadoActivo })
      .pipe(
        finalize(() => {
          this.accionId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const ix = this.tiposMoneda.findIndex((t) => t.id === tipo.id);
          if (ix >= 0) this.tiposMoneda[ix] = updated;
          this.tiposMoneda = [...this.tiposMoneda];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.actionError =
            typeof msg === 'string' ? msg : 'No se pudo cambiar el estado. Intente nuevamente.';
        },
      });
  }

  private sincronizar(): void {
    this.api.catalogList(this.recurso).subscribe({
      next: (data) => {
        this.tiposMoneda = Array.isArray(data) ? data : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
