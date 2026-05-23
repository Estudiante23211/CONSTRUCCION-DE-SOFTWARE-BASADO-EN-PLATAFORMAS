import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UsuarioApi {
  id: number;
  numeroIdentificacion: string;
  idRoles: number | null;
  rolNombre: string;
  idTipoIdentificacion: number | null;
  tipoIdentificacionNombre: string;
  nombre: string;
  apellido: string;
  correo: string;
  celular: string;
  usuario: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreador: string;
  fechaCreacion: string;
}

export interface RolOption {
  id: number;
  nombre: string;
}

export interface TipoIdentificacionOption {
  id: number;
  nombre: string;
}

export interface UsuarioFormOptions {
  roles: RolOption[];
  tiposIdentificacion: TipoIdentificacionOption[];
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly base = `${environment.apiUrl}/seguridad/usuarios`;
  private formOptionsCache$?: Observable<UsuarioFormOptions>;

  constructor(private http: HttpClient) {}

  formOptions(): Observable<UsuarioFormOptions> {
    if (!this.formOptionsCache$) {
      this.formOptionsCache$ = this.http
        .get<UsuarioFormOptions>(`${this.base}/form-options`)
        .pipe(shareReplay(1));
    }
    return this.formOptionsCache$;
  }

  invalidateFormOptionsCache(): void {
    this.formOptionsCache$ = undefined;
  }

  list(): Observable<UsuarioApi[]> {
    return this.http.get<UsuarioApi[]>(this.base);
  }

  create(body: {
    idRoles: number;
    idTipoIdentificacion: number;
    numeroIdentificacion: string;
    nombre: string;
    apellido: string;
    correo: string;
    celular?: string;
    usuario: string;
    clave: string;
  }): Observable<UsuarioApi> {
    return this.http.post<UsuarioApi>(this.base, body);
  }

  update(
    id: number,
    body: {
      nombre?: string;
      apellido?: string;
      numeroIdentificacion?: string;
      correo?: string;
      celular?: string;
      idRoles?: number;
      idTipoIdentificacion?: number;
      estadoActivo?: boolean;
      nuevaClave?: string;
    }
  ): Observable<UsuarioApi> {
    return this.http.patch<UsuarioApi>(`${this.base}/${id}`, body);
  }
}
