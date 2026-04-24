import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { RolesService, type RolApi } from '../../../core/services/roles.service';
import {
  validarRolNombreCreacion,
  validarRolDescripcionCreacion,
  validarRolNombreContenido,
  validarRolDescripcionContenido,
  validarNombreRolUnicoEnListado,
} from '@lib/validaciones';

export type Rol = RolApi;

type BootstrapModal = { show: () => void; hide: () => void };

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class Roles implements OnInit {
  tituloModulo = 'Creación de Roles';

  filtroNombre = '';
  filtroEstado = '';
  filtroFechaRegistro = '';

  modalTitulo = 'Creación de Rol';
  modoFormulario: 'crear' | 'editar' = 'crear';
  rolEditandoId: number | null = null;
  accionRolId: number | null = null;
  actionError = '';

  rolDetalle: Rol | null = null;

  rolForm: { nombre: string; descripcion: string } = { nombre: '', descripcion: '' };
  private rolFormInicial = { nombre: '', descripcion: '' };

  roles: Rol[] = [];
  loadPending = false;
  listLoaded = false;
  loadError = '';
  savePending = false;
  saveError = '';

  paginaActual = 1;
  /** Tamaño de página (selector Tarea 1). */
  itemsPorPagina = 5;
  readonly tamanoPaginaOpciones: readonly number[] = [5, 10, 25, 50];

  readonly maxNombre = 200;
  readonly maxDescripcion = 200;

  private readonly modalBootstrapOpts = { backdrop: 'static', keyboard: false } as const;

  constructor(
    private rolesService: RolesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
  }

  get sinRolesEnBd(): boolean {
    return this.listLoaded && !this.loadPending && !this.loadError && this.roles.length === 0;
  }

  get sinResultadosPorFiltro(): boolean {
    return (
      this.listLoaded &&
      !this.loadPending &&
      !this.loadError &&
      this.roles.length > 0 &&
      this.rolesFiltrados.length === 0
    );
  }

  get rolesFiltrados(): Rol[] {
    return this.roles.filter((r) => {
      const cumpleNombre =
        !this.filtroNombre.trim() ||
        r.nombre.toLowerCase().includes(this.filtroNombre.trim().toLowerCase());
      const cumpleEstado = !this.filtroEstado || r.estado === this.filtroEstado;
      const cumpleFecha =
        !this.filtroFechaRegistro || r.fechaCreacion === this.filtroFechaRegistro;
      return cumpleNombre && cumpleEstado && cumpleFecha;
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.rolesFiltrados.length / this.itemsPorPagina));
  }

  get rolesFiltradosPaginados(): Rol[] {
    const all = this.rolesFiltrados;
    const start = (this.paginaActual - 1) * this.itemsPorPagina;
    return all.slice(start, start + this.itemsPorPagina);
  }

  get hayMultiplesPaginas(): boolean {
    return this.rolesFiltrados.length > this.itemsPorPagina;
  }

  get mostrarBarraPaginacion(): boolean {
    return !this.sinResultadosPorFiltro && this.rolesFiltrados.length > 0;
  }

  onFiltrosCambiados(): void {
    this.paginaActual = 1;
    this.sincronizarPaginaConTotal();
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
    const t = Math.max(1, Math.ceil(this.rolesFiltrados.length / this.itemsPorPagina));
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

  cargarRoles(): void {
    this.loadError = '';
    this.loadPending = true;
    this.cdr.detectChanges();
    this.rolesService
      .list()
      .pipe(
        finalize(() => {
          this.loadPending = false;
          this.listLoaded = true;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.roles = Array.isArray(data) ? data : [];
          this.sincronizarPaginaConTotal();
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.loadError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cargar el listado de roles. Verifique la sesión y la API.';
        },
      });
  }

  abrirModalNuevo(): void {
    this.modalTitulo = 'Creación de Rol';
    this.modoFormulario = 'crear';
    this.rolEditandoId = null;
    this.saveError = '';
    this.rolForm = { nombre: '', descripcion: '' };
    setTimeout(() => this.showModal('modalRol'), 0);
  }

  abrirDetalle(rol: Rol): void {
    this.rolDetalle = rol;
    this.saveError = '';
    setTimeout(() => this.showModal('modalDetalleRol'), 0);
  }

  abrirEditar(rol: Rol): void {
    this.modalTitulo = 'Edición de Rol';
    this.modoFormulario = 'editar';
    this.rolEditandoId = rol.id;
    this.saveError = '';
    this.rolFormInicial = {
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
    };
    this.rolForm = { nombre: this.rolFormInicial.nombre, descripcion: this.rolFormInicial.descripcion };
    setTimeout(() => this.showModal('modalRol'), 0);
  }

  activarDesactivar(rol: Rol): void {
    this.actionError = '';
    if (this.accionRolId != null) return;
    this.accionRolId = rol.id;
    this.cdr.detectChanges();
    const next = !rol.estadoActivo;
    this.rolesService
      .update(rol.id, { estadoActivo: next })
      .pipe(
        finalize(() => {
          this.accionRolId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          const ix = this.roles.findIndex((r) => r.id === rol.id);
          if (ix >= 0) this.roles[ix] = updated;
          this.roles = [...this.roles];
        },
        error: (err) => {
          const msg = err?.error?.message;
          this.actionError =
            typeof msg === 'string'
              ? msg
              : 'No se pudo cambiar el estado del rol. Intente nuevamente.';
        },
      });
  }

  guardar(): void {
    this.saveError = '';

    if (this.modoFormulario === 'crear') {
      const vNombre = validarRolNombreCreacion(this.rolForm.nombre);
      if (!vNombre.valido) {
        this.saveError = vNombre.mensaje;
        return;
      }
      const vDesc = validarRolDescripcionCreacion(this.rolForm.descripcion);
      if (!vDesc.valido) {
        this.saveError = vDesc.mensaje;
        return;
      }
    } else {
      const nombreT = this.rolForm.nombre.trim();
      const descT = this.rolForm.descripcion.trim();
      if (
        nombreT === this.rolFormInicial.nombre.trim() &&
        descT === this.rolFormInicial.descripcion.trim()
      ) {
        this.saveError = 'No se han detectado cambios en la información';
        return;
      }
      if (!nombreT || !descT) {
        this.saveError = 'No se pueden guardar campos vacíos';
        return;
      }
      const vNombre = validarRolNombreContenido(this.rolForm.nombre);
      if (!vNombre.valido) {
        this.saveError = vNombre.mensaje;
        return;
      }
      const vDesc = validarRolDescripcionContenido(this.rolForm.descripcion);
      if (!vDesc.valido) {
        this.saveError = vDesc.mensaje;
        return;
      }
    }

    const nombre = this.rolForm.nombre.trim();
    const vUnico = validarNombreRolUnicoEnListado(
      nombre,
      this.roles,
      this.modoFormulario === 'editar' ? this.rolEditandoId : null
    );
    if (!vUnico.valido) {
      this.saveError = vUnico.mensaje;
      return;
    }

    const descripcion = this.rolForm.descripcion.trim();

    this.savePending = true;
    this.cdr.detectChanges();

    const editId = this.rolEditandoId;
    const req$ =
      editId != null
        ? this.rolesService.update(editId, {
            nombre,
            descripcion: descripcion || undefined,
          })
        : this.rolesService.create({ nombre, descripcion: descripcion || undefined });

    req$
      .pipe(
        finalize(() => {
          this.savePending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved) => {
          if (editId != null) {
            const ix = this.roles.findIndex((r) => r.id === saved.id);
            if (ix >= 0) this.roles[ix] = saved;
            this.roles = [...this.roles];
            this.rolEditandoId = null;
          } else {
            this.roles = [...this.roles, saved];
          }
          this.cdr.detectChanges();
          this.cerrarModalFormulario();
          setTimeout(() => this.cdr.detectChanges(), 0);
          this.sincronizarListadoEnSegundoPlano();
        },
        error: (err) => {
          if (err?.status === 409) {
            this.saveError = 'Este nombre ya está creado';
            return;
          }
          const msg = err?.error?.message;
          this.saveError =
            typeof msg === 'string' ? msg : 'No se pudo guardar el rol. Intente nuevamente.';
        },
      });
  }

  private sincronizarListadoEnSegundoPlano(): void {
    this.rolesService.list().subscribe({
      next: (data) => {
        this.roles = Array.isArray(data) ? data : [];
        this.sincronizarPaginaConTotal();
        this.cdr.detectChanges();
      },
      error: () => {
        /* listado optimista */
      },
    });
  }

  cerrarModalFormulario(): void {
    this.saveError = '';
    this.hideModal('modalRol');
  }

  cerrarModalDetalle(): void {
    this.hideModal('modalDetalleRol');
    this.rolDetalle = null;
  }
}
