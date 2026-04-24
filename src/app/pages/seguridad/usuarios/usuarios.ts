import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  UsuariosService,
  type UsuarioApi,
  type RolOption,
  type TipoIdentificacionOption,
} from '../../../core/services/usuarios.service';
import {
  validarUsuarioRolCreacion,
  validarUsuarioTipoIdentificacionCreacion,
  validarUsuarioNumeroIdentificacionCreacion,
  validarUsuarioNumeroIdentificacionUnicoEnListado,
  validarUsuarioNombreCreacion,
  validarUsuarioApellidoCreacion,
  validarUsuarioCorreoCreacion,
  validarUsuarioCelularCreacion,
  validarUsuarioAccesoCreacion,
  validarUsuarioNombreContenido,
  validarUsuarioApellidoContenido,
  validarUsuarioCorreoContenido,
  validarUsuarioCelularContenido,
  validarUsuarioNumeroIdentificacionContenido,
} from '@lib/validaciones';

export type UsuarioModel = UsuarioApi;

type BootstrapModal = { show: () => void; hide: () => void };

type FormInicialSnapshot = {
  idRoles: number | null;
  idTipoIdentificacion: number | null;
  numeroIdentificacion: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  usuario: string;
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  /** Para selects con `[ngValue]` numérico y valores del API. */
  compareById = (a: unknown, b: unknown): boolean =>
    a != null && b != null && Number(a) === Number(b);

  tituloModulo = 'Gestión de Usuarios';

  /** Texto libre: rol, identificación, nombre, apellido, usuario. */
  filtroBusqueda = '';
  /** '' = todos, 'Activo' | 'Inactivo' según `UsuarioApi.estado`. */
  filtroEstado = '';
  filtroFecha = '';

  modalTitulo = 'Creación de Usuario';
  editId: number | null = null;
  private formInicial: FormInicialSnapshot | null = null;

  form: {
    idRoles: number | null;
    idTipoIdentificacion: number | null;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    correo: string;
    celular: string;
    usuario: string;
    clave: string;
  } = this.emptyForm();

  usuarioDetalle: UsuarioModel | null = null;

  roles: RolOption[] = [];
  tiposIdentificacion: TipoIdentificacionOption[] = [];

  usuarios: UsuarioModel[] = [];
  loadPending = false;
  listLoaded = false;
  loadError = '';
  metaError = '';
  savePending = false;
  saveError = '';
  accionUsuarioId: number | null = null;
  actionError = '';

  paginaActual = 1;
  itemsPorPagina = 5;
  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];

  readonly maxNumeroId = 50;
  readonly maxNombre = 200;
  readonly maxApellido = 200;
  readonly maxCorreo = 200;
  readonly maxCelular = 20;
  readonly maxUsuario = 50;

  private readonly modalBootstrapOpts = { backdrop: 'static', keyboard: false } as const;

  constructor(
    private usuariosService: UsuariosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarMetaYListado();
  }

  get esCreacion(): boolean {
    return this.editId === null;
  }

  get longitudNumeroIdentificacionForm(): number {
    const v = this.form.numeroIdentificacion as unknown;
    if (v === null || v === undefined || v === '') return 0;
    return String(v).length;
  }

  get longitudCelularForm(): number {
    const v = this.form.celular as unknown;
    if (v === null || v === undefined || v === '') return 0;
    return String(v).length;
  }

  /** Valor de campo numérico del formulario como texto recortado (compatible con `type="number"`). */
  private formStr(v: unknown): string {
    if (v === null || v === undefined) return '';
    return String(v).trim();
  }

  get sinUsuariosEnBd(): boolean {
    return this.listLoaded && !this.loadPending && !this.loadError && this.usuarios.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.usuarios.length > 0 &&
      this.usuariosFiltrados.length === 0
    );
  }

  get usuariosFiltrados(): UsuarioModel[] {
    const q = this.filtroBusqueda.trim().toLowerCase();
    return this.usuarios.filter((u) => {
      const blob = [
        u.rolNombre,
        u.numeroIdentificacion,
        u.nombre,
        u.apellido,
        u.usuario,
      ]
        .map((s) => String(s ?? '').toLowerCase())
        .join(' ');
      const cumpleBusqueda = !q || blob.includes(q);
      const cumpleEstado = !this.filtroEstado || u.estado === this.filtroEstado;
      const fechaU = (u.fechaCreacion ?? '').trim();
      const fechaSolo = fechaU.length >= 10 ? fechaU.slice(0, 10) : fechaU;
      const cumpleFecha = !this.filtroFecha || fechaSolo === this.filtroFecha;
      return cumpleBusqueda && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina));
  }

  get usuariosFiltradosPaginados(): UsuarioModel[] {
    const all = this.usuariosFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.usuariosFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.usuariosFiltrados.length > 0;
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
    const t = Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina));
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

  private emptyForm() {
    return {
      idRoles: null,
      idTipoIdentificacion: null,
      numeroIdentificacion: '',
      nombre: '',
      apellido: '',
      correo: '',
      celular: '',
      usuario: '',
      clave: this.generarPassword(),
    };
  }

  private cargarMetaYListado(): void {
    this.loadError = '';
    this.metaError = '';
    this.loadPending = true;
    this.cdr.detectChanges();
    this.usuariosService.formOptions().subscribe({
      next: (meta) => {
        this.roles = Array.isArray(meta.roles) ? meta.roles : [];
        this.tiposIdentificacion = Array.isArray(meta.tiposIdentificacion)
          ? meta.tiposIdentificacion
          : [];
        this.cdr.detectChanges();
        this.cargarSoloListado();
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.metaError =
          typeof msg === 'string'
            ? msg
            : 'No se pudieron cargar roles y tipos de documento. Verifique la API.';
        this.cargarSoloListado();
      },
    });
  }

  private cargarSoloListado(): void {
    this.usuariosService
      .list()
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
          this.usuarios = Array.isArray(data) ? data : [];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cargar el listado de usuarios. Verifique la sesión y la API.';
        },
      });
  }

  reintentar(): void {
    this.listLoaded = false;
    this.cargarMetaYListado();
  }

  abrirNuevo(): void {
    this.modalTitulo = 'Creación de Usuario';
    this.editId = null;
    this.formInicial = null;
    this.saveError = '';
    this.form = this.emptyForm();
    setTimeout(() => this.showModal('modalUsuarioForm'), 0);
  }

  abrirEditar(usuario: UsuarioModel): void {
    this.modalTitulo = 'Edición de Usuario';
    this.editId = usuario.id;
    this.saveError = '';
    this.form = {
      idRoles: usuario.idRoles,
      idTipoIdentificacion: usuario.idTipoIdentificacion,
      numeroIdentificacion: usuario.numeroIdentificacion ?? '',
      nombre: usuario.nombre,
      apellido: usuario.apellido ?? '',
      correo: usuario.correo,
      celular: usuario.celular ?? '',
      usuario: usuario.usuario,
      clave: '',
    };
    this.formInicial = {
      idRoles: usuario.idRoles,
      idTipoIdentificacion: usuario.idTipoIdentificacion,
      numeroIdentificacion: String(usuario.numeroIdentificacion ?? '').trim(),
      nombre: usuario.nombre,
      apellido: usuario.apellido ?? '',
      correo: usuario.correo,
      celular: String(usuario.celular ?? '').trim(),
      usuario: usuario.usuario,
    };
    setTimeout(() => this.showModal('modalUsuarioForm'), 0);
  }

  abrirDetalle(usuario: UsuarioModel): void {
    this.usuarioDetalle = usuario;
    this.saveError = '';
    setTimeout(() => this.showModal('modalUsuarioDetalle'), 0);
  }

  regenerarClave(): void {
    this.form.clave = this.generarPassword();
  }

  copiarClave(): void {
    const t = this.form.clave ?? '';
    if (!t) return;
    void navigator.clipboard?.writeText(t).catch(() => {
      /* sin permisos o contexto no seguro */
    });
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalUsuarioForm');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalUsuarioDetalle');
    this.usuarioDetalle = null;
  }

  guardar(): void {
    this.saveError = '';

    if (this.editId != null) {
      this.guardarEdicion();
      return;
    }

    const v1 = validarUsuarioRolCreacion(this.form.idRoles);
    if (!v1.valido) {
      this.saveError = v1.mensaje;
      return;
    }
    const v2 = validarUsuarioTipoIdentificacionCreacion(this.form.idTipoIdentificacion);
    if (!v2.valido) {
      this.saveError = v2.mensaje;
      return;
    }
    const v3 = validarUsuarioNumeroIdentificacionCreacion(this.formStr(this.form.numeroIdentificacion));
    if (!v3.valido) {
      this.saveError = v3.mensaje;
      return;
    }
    const vU = validarUsuarioNumeroIdentificacionUnicoEnListado(
      this.usuarios,
      this.formStr(this.form.numeroIdentificacion),
      null
    );
    if (!vU.valido) {
      this.saveError = vU.mensaje;
      return;
    }
    const vn = validarUsuarioNombreCreacion(this.form.nombre);
    if (!vn.valido) {
      this.saveError = vn.mensaje;
      return;
    }
    const va = validarUsuarioApellidoCreacion(this.form.apellido);
    if (!va.valido) {
      this.saveError = va.mensaje;
      return;
    }
    const vc = validarUsuarioCorreoCreacion(this.form.correo);
    if (!vc.valido) {
      this.saveError = vc.mensaje;
      return;
    }
    const vcel = validarUsuarioCelularCreacion(this.formStr(this.form.celular));
    if (!vcel.valido) {
      this.saveError = vcel.mensaje;
      return;
    }
    const vu = validarUsuarioAccesoCreacion(this.form.usuario);
    if (!vu.valido) {
      this.saveError = vu.mensaje;
      return;
    }

    this.savePending = true;
    this.cdr.detectChanges();

    this.usuariosService
      .create({
        idRoles: this.form.idRoles!,
        idTipoIdentificacion: this.form.idTipoIdentificacion!,
        numeroIdentificacion: this.formStr(this.form.numeroIdentificacion),
        nombre: this.form.nombre.trim(),
        apellido: this.form.apellido.trim(),
        correo: this.form.correo.trim(),
        celular: this.formStr(this.form.celular) || undefined,
        usuario: this.form.usuario.trim(),
        clave: this.form.clave,
      })
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (created) => {
          this.usuarios = [...this.usuarios, created];
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.sincronizarListadoEnSegundoPlano();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorGuardado(err);
        },
      });
  }

  private guardarEdicion(): void {
    const id = this.editId!;
    const f = this.form;

    if (
      !String(f.numeroIdentificacion).trim() ||
      !String(f.nombre).trim() ||
      !String(f.apellido).trim() ||
      !String(f.correo).trim() ||
      !String(f.celular).trim() ||
      f.idRoles == null ||
      f.idRoles <= 0 ||
      f.idTipoIdentificacion == null ||
      f.idTipoIdentificacion <= 0
    ) {
      this.saveError = 'No se pueden guardar campos vacíos';
      return;
    }

    if (this.formEditadoSinCambios()) {
      this.saveError = 'No se detectaron cambios en la información';
      return;
    }

    const vR = validarUsuarioRolCreacion(f.idRoles);
    if (!vR.valido) {
      this.saveError = vR.mensaje;
      return;
    }
    const vT = validarUsuarioTipoIdentificacionCreacion(f.idTipoIdentificacion);
    if (!vT.valido) {
      this.saveError = vT.mensaje;
      return;
    }
    const vNum = validarUsuarioNumeroIdentificacionContenido(this.formStr(f.numeroIdentificacion));
    if (!vNum.valido) {
      this.saveError = vNum.mensaje;
      return;
    }
    const vUni = validarUsuarioNumeroIdentificacionUnicoEnListado(
      this.usuarios,
      this.formStr(f.numeroIdentificacion),
      id
    );
    if (!vUni.valido) {
      this.saveError = vUni.mensaje;
      return;
    }
    const vNom = validarUsuarioNombreContenido(f.nombre);
    if (!vNom.valido) {
      this.saveError = vNom.mensaje;
      return;
    }
    const vApe = validarUsuarioApellidoContenido(f.apellido);
    if (!vApe.valido) {
      this.saveError = vApe.mensaje;
      return;
    }
    const vCor = validarUsuarioCorreoContenido(f.correo);
    if (!vCor.valido) {
      this.saveError = vCor.mensaje;
      return;
    }
    const vCel = validarUsuarioCelularContenido(this.formStr(f.celular));
    if (!vCel.valido) {
      this.saveError = vCel.mensaje;
      return;
    }

    this.savePending = true;
    this.cdr.detectChanges();

    const body = {
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      numeroIdentificacion: this.formStr(f.numeroIdentificacion),
      correo: f.correo.trim(),
      celular: this.formStr(f.celular),
      idRoles: f.idRoles!,
      idTipoIdentificacion: f.idTipoIdentificacion!,
    };

    this.usuariosService
      .update(id, body)
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved) => {
          const ix = this.usuarios.findIndex((u) => u.id === saved.id);
          if (ix >= 0) this.usuarios[ix] = saved;
          this.usuarios = [...this.usuarios];
          this.editId = null;
          this.formInicial = null;
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.sincronizarListadoEnSegundoPlano();
        },
        error: (err) => {
          this.saveError = this.mensajeErrorGuardado(err);
        },
      });
  }

  private formEditadoSinCambios(): boolean {
    if (!this.formInicial || this.editId == null) return false;
    const f = this.form;
    const i = this.formInicial;
    return (
      f.idRoles === i.idRoles &&
      f.idTipoIdentificacion === i.idTipoIdentificacion &&
      this.formStr(f.numeroIdentificacion) === i.numeroIdentificacion.trim() &&
      f.nombre.trim() === i.nombre.trim() &&
      f.apellido.trim() === i.apellido.trim() &&
      f.correo.trim() === i.correo.trim() &&
      this.formStr(f.celular) === i.celular.trim()
    );
  }

  private mensajeErrorGuardado(err: unknown): string {
    const status = (err as { status?: number })?.status;
    const msg = (err as { error?: { message?: string } })?.error?.message;
    const s = typeof msg === 'string' ? msg : '';
    if (status === 409) {
      const low = s.toLowerCase();
      if (low.includes('identificación') || low.includes('identificacion')) {
        return 'Este número de identificación ya está registrado';
      }
      if (s) return s;
    }
    return typeof msg === 'string' ? msg : 'No se pudo guardar el usuario. Intente nuevamente.';
  }

  activarDesactivar(usuario: UsuarioModel): void {
    this.actionError = '';
    if (this.accionUsuarioId != null) return;
    this.accionUsuarioId = usuario.id;
    this.cdr.detectChanges();
    const next = !usuario.estadoActivo;
    this.usuariosService
      .update(usuario.id, { estadoActivo: next })
      .pipe(
        finalize(() => {
          this.accionUsuarioId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const ix = this.usuarios.findIndex((u) => u.id === usuario.id);
          if (ix >= 0) this.usuarios[ix] = updated;
          this.usuarios = [...this.usuarios];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.actionError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cambiar el estado del usuario. Intente nuevamente.';
        },
      });
  }

  private sincronizarListadoEnSegundoPlano(): void {
    this.usuariosService.list().subscribe({
      next: (data) => {
        this.usuarios = Array.isArray(data) ? data : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {
        /* listado optimista */
      },
    });
  }

  /**
   * Cumple la política del servidor: 8–12 caracteres, mayúscula, minúscula, dígito y símbolo.
   */
  generarPassword(): string {
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const special = '!@#$%';
    const all = lower + upper + digits + special;
    const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
    const parts = [pick(lower), pick(upper), pick(digits), pick(special)];
    for (let i = 0; i < 6; i++) parts.push(pick(all));
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }
    return parts.join('');
  }
}
