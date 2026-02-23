import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UsuarioModel {
  id: number;
  rol: string;
  tipoIdentificacion: string;
  identificacion: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  usuario: string;
  clave: string;
  estado: 'Activo' | 'Inactivo';
  usuarioCreador: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios {

  @ViewChild('btnAbrirModal') btnAbrirModal!: ElementRef<HTMLButtonElement>;

  tituloModulo = 'Gestión de Usuarios';

  /* Filtros */
  filtroIdentificacion = '';
  filtroNombre = '';
  filtroFecha = '';

  /* Modal */
  modalTitulo = 'Creación de Usuario';
  modoDetalle = false;
  editId: number | null = null;

  form: any = {};

  roles = ['Administrador', 'Vendedor', 'Inventario'];
  tiposIdentificacion = ['Cédula', 'NIT', 'Pasaporte'];

  usuarios: UsuarioModel[] = [];

  get usuariosFiltrados() {
    return this.usuarios.filter(u => {
      const cumpleId =
        !this.filtroIdentificacion ||
        u.identificacion.includes(this.filtroIdentificacion);

      const cumpleNombre =
        !this.filtroNombre ||
        u.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase());

      const cumpleFecha =
        !this.filtroFecha || u.fechaCreacion === this.filtroFecha;

      return cumpleId && cumpleNombre && cumpleFecha;
    });
  }

  abrirNuevo() {
    this.modalTitulo = 'Creación de Usuario';
    this.modoDetalle = false;
    this.editId = null;

    this.form = {
      rol: '',
      tipoIdentificacion: '',
      identificacion: '',
      nombre: '',
      apellido: '',
      correo: '',
      celular: '',
      usuario: '',
      clave: this.generarPassword()
    };

    this.triggerModal();
  }

  abrirEditar(usuario: UsuarioModel) {
    this.modalTitulo = 'Edición de Usuario';
    this.modoDetalle = false;
    this.editId = usuario.id;
    this.form = { ...usuario };
    this.triggerModal();
  }

  abrirDetalle(usuario: UsuarioModel) {
    this.modalTitulo = 'Detalle de Usuario';
    this.modoDetalle = true;
    this.editId = null;
    this.form = { ...usuario };
    this.triggerModal();
  }

  guardar() {
    if (!this.form.nombre) return;

    if (this.editId !== null) {
      const index = this.usuarios.findIndex(u => u.id === this.editId);
      if (index !== -1) {
        this.usuarios[index] = {
          ...this.usuarios[index],
          ...this.form
        };
      }
    } else {
      const nuevoId = this.usuarios.length + 1;
      this.usuarios.push({
        ...this.form,
        id: nuevoId,
        estado: 'Activo',
        usuarioCreador: 'Usuario de Prueba',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      });
    }

    this.cerrarModal();
  }

  activarDesactivar(usuario: UsuarioModel) {
    usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
  }

  generarPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  private triggerModal() {
    setTimeout(() => this.btnAbrirModal?.nativeElement.click(), 0);
  }

  cerrarModal() {
    const modalEl = document.getElementById('modalUsuario');
    if (modalEl) {
      const instance = (window as any).bootstrap?.Modal?.getInstance(modalEl);
      if (instance) instance.hide();
    }
  }

}
