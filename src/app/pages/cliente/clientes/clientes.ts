import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  ClientesApiService,
  type ClienteApi,
  type TipoIdentificacionOpcion,
} from '../../../core/services/clientes-api.service';
import {
  validarClienteTipoClienteSeleccionCreacion,
  validarClienteCategoriaSeleccionCreacion,
  validarClienteTipoIdentificacionSeleccionCreacion,
  validarClienteIdentificacionCreacion,
  validarClienteIdentificacionUnicoEnListado,
  validarClienteIdentificacionContenido,
  validarClienteDigitoVerificacionNitCreacion,
  validarClienteDigitoVerificacionNitContenido,
  validarClienteNombreComercialCreacion,
  validarClienteNombreComercialContenido,
  validarClienteNombreComercialUnicoEnListado,
  validarClienteRazonSocialCreacion,
  validarClienteRazonSocialContenido,
  validarClienteRazonSocialUnicoEnListado,
  validarClienteNombrePersonaCreacion,
  validarClienteNombrePersonaContenido,
  validarClienteApellidosCreacion,
  validarClienteApellidosContenido,
  validarClienteCorreoCreacion,
  validarClienteCorreoContenido,
  validarClienteCelularCreacion,
  validarClienteCelularContenido,
  validarClienteDireccionCreacion,
  validarClienteDireccionContenido,
  validarClienteTipoClienteSeleccionContenido,
  validarClienteCategoriaSeleccionContenido,
} from '@lib/validaciones';

export type ClienteModel = ClienteApi;

type BootstrapModal = { show: () => void; hide: () => void };

type FormInicialSnapshot = {
  idTipoCliente: number | null;
  idCategoriaCliente: number | null;
  idTipoIdentificacion: number | null;
  identificacion: string;
  digitoVerificacion: string;
  nombre: string;
  apellidos: string;
  nombreComercial: string;
  razonSocial: string;
  direccion: string;
  celular: string;
  correo: string;
};

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  compareById = (a: unknown, b: unknown): boolean =>
    a != null && b != null && Number(a) === Number(b);

  tituloModulo = 'Gestión de Clientes';

  tiposCliente: { id: number; nombre: string }[] = [];
  categoriasCliente: { id: number; nombre: string }[] = [];
  tiposIdentificacionCatalog: TipoIdentificacionOpcion[] = [];

  metaError = '';

  busquedaTexto = '';
  filtroFecha = '';

  modalTitulo = '';
  editId: number | null = null;
  private formInicial: FormInicialSnapshot | null = null;
  clienteDetalle: ClienteModel | null = null;
  clienteEliminar: ClienteModel | null = null;

  form: {
    idTipoCliente: number | null;
    idCategoriaCliente: number | null;
    idTipoIdentificacion: number | null;
    identificacion: string;
    digitoVerificacion: string;
    nombre: string;
    apellidos: string;
    nombreComercial: string;
    razonSocial: string;
    direccion: string;
    celular: string;
    correo: string;
  } = this.resetForm();

  clientes: ClienteModel[] = [];
  loadPending = false;
  listLoaded = false;
  loadError = '';
  savePending = false;
  saveError = '';
  deletePending = false;
  deleteError = '';

  paginaActual = 1;
  itemsPorPagina = 5;
  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];

  readonly maxIdent = 50;
  readonly maxDigito = 1;
  readonly maxNombrePersona = 200;
  readonly maxNombreComercial = 200;
  readonly maxRazonSocial = 200;
  readonly maxDireccion = 200;
  readonly maxCelular = 20;
  readonly maxCorreo = 200;

  private readonly modalBootstrapOpts = { backdrop: 'static', keyboard: false } as const;

  constructor(
    private clientesApi: ClientesApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCatalogosYClientes();
  }

  get esCreacion(): boolean {
    return this.editId === null;
  }

  get esNIT(): boolean {
    const id = this.form.idTipoIdentificacion;
    if (id == null) return false;
    const t = this.tiposIdentificacionCatalog.find((x) => x.id === id);
    return !!t?.esNit;
  }

  /** Evita notación científica y signos en inputs type="number" (solo enteros ≥ 0). */
  soloDigitosEnterosNoNegativosKeydown(e: KeyboardEvent): void {
    if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  }

  private strCampoNumerico(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }

  get longitudIdentificacionForm(): number {
    return this.strCampoNumerico(this.form.identificacion).length;
  }

  get longitudDigitoVerificacionForm(): number {
    return this.strCampoNumerico(this.form.digitoVerificacion).length;
  }

  get longitudCelularForm(): number {
    return this.strCampoNumerico(this.form.celular).length;
  }

  get longitudNombreComercialForm(): number {
    return this.form.nombreComercial.length;
  }

  get longitudNombreForm(): number {
    return this.form.nombre.length;
  }

  esNitCliente(c: ClienteModel | null): boolean {
    if (!c) return false;
    return String(c.tipoIdentificacionNombre || '').toUpperCase().includes('NIT');
  }

  nitIdentLabel(c: ClienteModel): string {
    if (this.esNitCliente(c) && c.digitoVerificacion != null && String(c.digitoVerificacion).trim() !== '') {
      return `${c.identificacion || ''}-${c.digitoVerificacion}`;
    }
    return c.identificacion || '—';
  }

  nombreComercialListado(c: ClienteModel): string {
    const com = String(c.nombreComercial || '').trim();
    if (com) return com;
    return `${String(c.nombre || '').trim()} ${String(c.apellidos || '').trim()}`.trim() || '—';
  }

  get sinClientes(): boolean {
    return this.listLoaded && !this.loadPending && !this.loadError && this.clientes.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.clientes.length > 0 &&
      this.clientesFiltrados.length === 0
    );
  }

  get clientesFiltrados(): ClienteModel[] {
    const q = this.busquedaTexto.trim().toLowerCase();
    return this.clientes.filter((c) => {
      if (c.estado !== 'Activo') return false;
      const fechaOk = !this.filtroFecha || c.fechaCreacion === this.filtroFecha;
      if (!fechaOk) return false;
      if (!q) return true;
      const bloques = [
        c.tipoClienteNombre,
        c.categoriaClienteNombre,
        c.identificacion,
        c.nombreComercial,
        `${c.nombre || ''} ${c.apellidos || ''}`,
        c.nombre,
        c.apellidos,
      ];
      return bloques.some((b) => String(b ?? '').toLowerCase().includes(q));
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina));
  }

  get clientesFiltradosPaginados(): ClienteModel[] {
    const all = this.clientesFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.clientesFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.clientesFiltrados.length > 0;
  }

  onBusquedaCambiada(): void {
    this.paginaActual = 1;
    this.sincronizarPaginaConTotal();
    this.cdr.detectChanges();
  }

  onFiltroFechaCambiada(): void {
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
    const t = Math.max(1, Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina));
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

  cargarCatalogosYClientes(): void {
    this.loadError = '';
    this.metaError = '';
    this.loadPending = true;
    this.cdr.detectChanges();
    this.clientesApi.clientesCatalogos().subscribe({
      next: (cat) => {
        this.tiposCliente = Array.isArray(cat.tiposCliente) ? cat.tiposCliente : [];
        this.categoriasCliente = Array.isArray(cat.categoriasCliente) ? cat.categoriasCliente : [];
        this.tiposIdentificacionCatalog = Array.isArray(cat.tiposIdentificacion)
          ? cat.tiposIdentificacion
          : [];
        this.cdr.detectChanges();
        this.cargarSoloClientes();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.metaError =
          typeof msg === 'string'
            ? msg
            : 'No se pudieron cargar los catálogos. Verifique la API.';
        this.cargarSoloClientes();
      },
    });
  }

  private cargarSoloClientes(): void {
    this.clientesApi
      .clientesList()
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
          this.clientes = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cargar el listado de clientes. Verifique la sesión y la API.';
        },
      });
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargarCatalogosYClientes();
  }

  resetForm() {
    return {
      idTipoCliente: null,
      idCategoriaCliente: null,
      idTipoIdentificacion: null,
      identificacion: '',
      digitoVerificacion: '',
      nombre: '',
      apellidos: '',
      nombreComercial: '',
      razonSocial: '',
      direccion: '',
      celular: '',
      correo: '',
    };
  }

  private snapshotForm(): FormInicialSnapshot {
    const f = this.form;
    return {
      idTipoCliente: f.idTipoCliente,
      idCategoriaCliente: f.idCategoriaCliente,
      idTipoIdentificacion: f.idTipoIdentificacion,
      identificacion: this.strCampoNumerico(f.identificacion),
      digitoVerificacion: this.strCampoNumerico(f.digitoVerificacion),
      nombre: String(f.nombre ?? '').trim(),
      apellidos: String(f.apellidos ?? '').trim(),
      nombreComercial: String(f.nombreComercial ?? '').trim(),
      razonSocial: String(f.razonSocial ?? '').trim(),
      direccion: String(f.direccion ?? '').trim(),
      celular: this.strCampoNumerico(f.celular),
      correo: String(f.correo ?? '').trim(),
    };
  }

  private mismoSnapshot(a: FormInicialSnapshot, b: FormInicialSnapshot): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Cliente';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = this.resetForm();
    setTimeout(() => this.showModal('modalClienteForm'), 0);
  }

  abrirEditar(cliente: ClienteModel): void {
    this.modalTitulo = 'Edición de Cliente';
    this.editId = cliente.id;
    this.saveError = '';
    this.form = {
      idTipoCliente: cliente.idTipoCliente,
      idCategoriaCliente: cliente.idCategoriaCliente,
      idTipoIdentificacion: cliente.idTipoIdentificacion,
      identificacion: cliente.identificacion ?? '',
      digitoVerificacion: cliente.digitoVerificacion != null ? String(cliente.digitoVerificacion) : '',
      nombre: cliente.nombre ?? '',
      apellidos: cliente.apellidos ?? '',
      nombreComercial: cliente.nombreComercial ?? '',
      razonSocial: cliente.razonSocial ?? '',
      direccion: cliente.direccion ?? '',
      celular: cliente.celular ?? '',
      correo: cliente.correo ?? '',
    };
    this.formInicial = this.snapshotForm();
    setTimeout(() => this.showModal('modalClienteForm'), 0);
  }

  verDetalle(cliente: ClienteModel): void {
    this.clienteDetalle = cliente;
    setTimeout(() => this.showModal('modalClienteDetalle'), 0);
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalClienteForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalClienteDetalle');
    this.clienteDetalle = null;
  }

  cerrarModalEliminar(): void {
    this.deleteError = '';
    this.hideModal('modalClienteEliminar');
    this.clienteEliminar = null;
  }

  private validarCreacion(): string | null {
    const f = this.form;
    const checks: Array<{ r: { valido: boolean; mensaje: string } }> = [
      { r: validarClienteTipoClienteSeleccionCreacion(f.idTipoCliente) },
      { r: validarClienteCategoriaSeleccionCreacion(f.idCategoriaCliente) },
      { r: validarClienteTipoIdentificacionSeleccionCreacion(f.idTipoIdentificacion) },
      { r: validarClienteIdentificacionCreacion(f.identificacion) },
    ];
    const u = validarClienteIdentificacionUnicoEnListado(this.clientes, f.identificacion, null);
    checks.push({ r: u });
    if (this.esNIT) {
      checks.push(
        { r: validarClienteDigitoVerificacionNitCreacion(f.digitoVerificacion) },
        { r: validarClienteNombreComercialCreacion(f.nombreComercial) },
        { r: validarClienteRazonSocialCreacion(f.razonSocial) }
      );
      checks.push(
        { r: validarClienteNombreComercialUnicoEnListado(this.clientes, f.nombreComercial, null) },
        { r: validarClienteRazonSocialUnicoEnListado(this.clientes, f.razonSocial, null) }
      );
    } else if (f.idTipoIdentificacion != null) {
      checks.push(
        { r: validarClienteNombrePersonaCreacion(f.nombre) },
        { r: validarClienteApellidosCreacion(f.apellidos) }
      );
    }
    checks.push(
      { r: validarClienteCelularCreacion(f.celular) },
      { r: validarClienteCorreoCreacion(f.correo) },
      { r: validarClienteDireccionCreacion(f.direccion) }
    );
    for (const c of checks) {
      if (!c.r.valido) return c.r.mensaje;
    }
    return null;
  }

  private validarEdicion(): string | null {
    const f = this.form;
    const ini = this.formInicial;
    if (!ini) return 'No se detectaron cambios en la información';

    const vacio = (s: string) => String(s ?? '').trim() === '';

    if (
      vacio(f.direccion) ||
      vacio(f.celular) ||
      vacio(f.correo) ||
      f.idTipoCliente == null ||
      f.idCategoriaCliente == null
    ) {
      return 'No se pueden guardar campos vacíos';
    }

    if (this.esNIT) {
      if (vacio(f.digitoVerificacion) || vacio(f.nombreComercial) || vacio(f.razonSocial)) {
        return 'No se pueden guardar campos vacíos';
      }
    } else {
      if (vacio(f.nombre) || vacio(f.apellidos)) {
        return 'No se pueden guardar campos vacíos';
      }
    }

    const snap = this.snapshotForm();
    if (this.mismoSnapshot(snap, ini)) {
      return 'No se detectaron cambios en la información';
    }

    const checks: Array<{ r: { valido: boolean; mensaje: string } }> = [
      { r: validarClienteTipoClienteSeleccionContenido(f.idTipoCliente) },
      { r: validarClienteCategoriaSeleccionContenido(f.idCategoriaCliente) },
      { r: validarClienteIdentificacionContenido(f.identificacion) },
    ];
    if (this.esNIT) {
      checks.push(
        { r: validarClienteDigitoVerificacionNitContenido(f.digitoVerificacion) },
        { r: validarClienteNombreComercialContenido(f.nombreComercial) },
        { r: validarClienteRazonSocialContenido(f.razonSocial) },
        {
          r: validarClienteNombreComercialUnicoEnListado(this.clientes, f.nombreComercial, this.editId),
        },
        { r: validarClienteRazonSocialUnicoEnListado(this.clientes, f.razonSocial, this.editId) }
      );
    } else {
      checks.push(
        { r: validarClienteNombrePersonaContenido(f.nombre) },
        { r: validarClienteApellidosContenido(f.apellidos) }
      );
    }
    checks.push(
      { r: validarClienteCelularContenido(f.celular) },
      { r: validarClienteCorreoContenido(f.correo) },
      { r: validarClienteDireccionContenido(f.direccion) }
    );
    for (const c of checks) {
      if (!c.r.valido) return c.r.mensaje;
    }
    return null;
  }

  private mapErrorGuardado(err: unknown): string {
    const status = (err as { status?: number })?.status;
    const raw = (err as { error?: { message?: string } })?.error?.message;
    const msg = typeof raw === 'string' ? raw : '';
    if (status === 409 || /ya existe un cliente con esa identificaci/i.test(msg)) {
      return 'Esta identificación ya está registrada';
    }
    return msg || 'No se pudo guardar el cliente. Intente nuevamente.';
  }

  guardar(): void {
    this.saveError = '';
    if (this.editId != null) {
      const err = this.validarEdicion();
      if (err) {
        this.saveError = err;
        return;
      }
      this.ejecutarGuardarEdicion();
      return;
    }

    const errC = this.validarCreacion();
    if (errC) {
      this.saveError = errC;
      return;
    }

    const f = this.form;
    const body = {
      idTipoCliente: f.idTipoCliente,
      idCategoriaCliente: f.idCategoriaCliente,
      idTipoIdentificacion: f.idTipoIdentificacion,
      identificacion: this.strCampoNumerico(f.identificacion),
      nombre: f.nombre.trim() || undefined,
      apellidos: f.apellidos.trim() || undefined,
      nombreComercial: f.nombreComercial.trim() || undefined,
      razonSocial: f.razonSocial.trim() || undefined,
      direccion: f.direccion.trim(),
      celular: this.strCampoNumerico(f.celular),
      correo: f.correo.trim(),
      digitoVerificacion: this.esNIT ? Number(this.strCampoNumerico(f.digitoVerificacion)) : undefined,
    };

    this.savePending = true;
    this.cdr.detectChanges();
    this.clientesApi
      .clienteCreate(body)
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (created) => {
          this.clientes = [...this.clientes, created];
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.refrescarClientes();
        },
        error: (err) => {
          this.saveError = this.mapErrorGuardado(err);
        },
      });
  }

  private ejecutarGuardarEdicion(): void {
    const f = this.form;
    const id = this.editId!;
    const body = {
      idTipoCliente: f.idTipoCliente,
      idCategoriaCliente: f.idCategoriaCliente,
      nombre: f.nombre.trim(),
      apellidos: f.apellidos.trim(),
      nombreComercial: f.nombreComercial.trim(),
      razonSocial: f.razonSocial.trim(),
      direccion: f.direccion.trim(),
      celular: this.strCampoNumerico(f.celular),
      correo: f.correo.trim(),
      digitoVerificacion: this.esNIT ? Number(this.strCampoNumerico(f.digitoVerificacion)) : null,
    };

    this.savePending = true;
    this.cdr.detectChanges();
    this.clientesApi
      .clienteUpdate(id, body)
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved) => {
          const ix = this.clientes.findIndex((c) => c.id === saved.id);
          if (ix >= 0) this.clientes[ix] = saved;
          this.clientes = [...this.clientes];
          this.editId = null;
          this.formInicial = null;
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.refrescarClientes();
        },
        error: (err) => {
          this.saveError = this.mapErrorGuardado(err);
        },
      });
  }

  abrirEliminar(cliente: ClienteModel): void {
    this.clienteEliminar = cliente;
    this.deleteError = '';
    setTimeout(() => this.showModal('modalClienteEliminar'), 0);
  }

  confirmarEliminar(): void {
    if (!this.clienteEliminar) return;
    this.deleteError = '';
    this.deletePending = true;
    this.cdr.detectChanges();
    this.clientesApi
      .clienteEliminar(this.clienteEliminar.id)
      .pipe(
        finalize(() => {
          this.deletePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.clientes = this.clientes.filter((c) => c.id !== this.clienteEliminar!.id);
          this.cerrarModalEliminar();
          this.refrescarClientes();
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.deleteError =
            typeof msg === 'string' ? msg : 'No se pudo eliminar el cliente. Intente nuevamente.';
        },
      });
  }

  private refrescarClientes(): void {
    this.clientesApi.clientesList().subscribe({
      next: (data) => {
        this.clientes = Array.isArray(data) ? data : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }
}
