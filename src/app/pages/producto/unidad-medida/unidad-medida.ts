import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProductosApiService, type CatalogoProductoPantalla } from '../../../core/services/productos-api.service';
import {
  validarUnidadMedidaNombreCreacion,
  validarUnidadMedidaNombreUnicoEnListado,
  validarUnidadMedidaDescripcionCreacion,
  validarUnidadMedidaNombreContenido,
  validarUnidadMedidaDescripcionContenido,
} from '@lib/validaciones';

export type UnidadMedidaModel = CatalogoProductoPantalla;

type BootstrapModal = { show: () => void; hide: () => void };

type FormInicialSnapshot = { nombre: string; descripcion: string };

@Component({
  selector: 'app-unidad-medida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unidad-medida.html',
  styleUrl: './unidad-medida.css',
})
export class UnidadMedida implements OnInit {
  private readonly recurso = 'unidades-medida' as const;

  tituloModulo = 'Gestión de Unidades de Medida';

  filtroNombre = '';
  filtroEstado = '';
  filtroFecha = '';

  modalTitulo = 'Creación de Unidad de Medida';
  editId: number | null = null;
  private formInicial: FormInicialSnapshot | null = null;

  form = { nombre: '', descripcion: '' };

  unidadDetalle: UnidadMedidaModel | null = null;

  unidades: UnidadMedidaModel[] = [];
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
    return this.listLoaded && !this.loadPending && !this.loadError && this.unidades.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.unidades.length > 0 &&
      this.unidadesFiltradas.length === 0
    );
  }

  get unidadesFiltradas(): UnidadMedidaModel[] {
    return this.unidades.filter((u) => {
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        u.nombre.toLowerCase().includes(this.filtroNombre.trim().toLowerCase());
      const cumpleEstado = !this.filtroEstado || u.estado === this.filtroEstado;
      const fechaT = (u.fechaCreacion ?? '').trim();
      const fechaSolo = fechaT.length >= 10 ? fechaT.slice(0, 10) : fechaT;
      const cumpleFecha = !this.filtroFecha || fechaSolo === this.filtroFecha;
      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.unidadesFiltradas.length / this.itemsPorPagina));
  }

  get unidadesFiltradasPaginadas(): UnidadMedidaModel[] {
    const all = this.unidadesFiltradas;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.unidadesFiltradas.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.unidadesFiltradas.length > 0;
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
    const t = Math.max(1, Math.ceil(this.unidadesFiltradas.length / this.itemsPorPagina));
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
          this.unidades = Array.isArray(data) ? data : [];
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
    this.modalTitulo = 'Creación de Unidad de Medida';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = { nombre: '', descripcion: '' };
    setTimeout(() => this.showModal('modalUnidadMedidaForm'), 0);
  }

  abrirEditar(unidad: UnidadMedidaModel): void {
    this.modalTitulo = 'Edición de Unidad de Medida';
    this.editId = unidad.id;
    this.saveError = '';
    this.form = { nombre: unidad.nombre, descripcion: unidad.descripcion ?? '' };
    this.formInicial = {
      nombre: unidad.nombre.trim(),
      descripcion: String(unidad.descripcion ?? '').trim(),
    };
    setTimeout(() => this.showModal('modalUnidadMedidaForm'), 0);
  }

  abrirDetalle(unidad: UnidadMedidaModel): void {
    this.unidadDetalle = unidad;
    this.saveError = '';
    setTimeout(() => this.showModal('modalUnidadMedidaDetalle'), 0);
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalUnidadMedidaForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalUnidadMedidaDetalle');
    this.unidadDetalle = null;
  }

  guardar(): void {
    this.saveError = '';

    if (this.editId != null) {
      this.guardarEdicion();
      return;
    }

    const vN = validarUnidadMedidaNombreCreacion(this.form.nombre);
    if (!vN.valido) {
      this.saveError = vN.mensaje;
      return;
    }
    const vU = validarUnidadMedidaNombreUnicoEnListado(this.unidades, this.form.nombre, null);
    if (!vU.valido) {
      this.saveError = vU.mensaje;
      return;
    }
    const vD = validarUnidadMedidaDescripcionCreacion(this.form.descripcion);
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
          this.unidades = [...this.unidades, saved];
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

    const vNom = validarUnidadMedidaNombreContenido(f.nombre);
    if (!vNom.valido) {
      this.saveError = vNom.mensaje;
      return;
    }
    const vUni = validarUnidadMedidaNombreUnicoEnListado(this.unidades, f.nombre, id);
    if (!vUni.valido) {
      this.saveError = vUni.mensaje;
      return;
    }
    const vDesc = validarUnidadMedidaDescripcionContenido(f.descripcion);
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
          const ix = this.unidades.findIndex((u) => u.id === saved.id);
          if (ix >= 0) this.unidades[ix] = saved;
          this.unidades = [...this.unidades];
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
    if (status === 409) return 'Esta unidad de medida ya está creada';
    const msg = (err as { error?: { message?: string } })?.error?.message;
    return typeof msg === 'string' ? msg : 'No se pudo guardar. Intente nuevamente.';
  }

  activarDesactivar(unidad: UnidadMedidaModel): void {
    this.actionError = '';
    if (this.accionId != null) return;
    this.accionId = unidad.id;
    this.cdr.detectChanges();
    this.api
      .catalogPatch(this.recurso, unidad.id, { estadoActivo: !unidad.estadoActivo })
      .pipe(
        finalize(() => {
          this.accionId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const ix = this.unidades.findIndex((u) => u.id === unidad.id);
          if (ix >= 0) this.unidades[ix] = updated;
          this.unidades = [...this.unidades];
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
        this.unidades = Array.isArray(data) ? data : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
