import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RolApi {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreador: string;
  fechaCreacion: string;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly base = `${environment.apiUrl}/seguridad/roles`;

  constructor(private http: HttpClient) {}

  list(): Observable<RolApi[]> {
    return this.http.get<RolApi[]>(this.base);
  }

  create(body: { nombre: string; descripcion?: string }): Observable<RolApi> {
    return this.http.post<RolApi>(this.base, body);
  }

  update(
    id: number,
    body: { nombre?: string; descripcion?: string; estadoActivo?: boolean }
  ): Observable<RolApi> {
    return this.http.patch<RolApi>(`${this.base}/${id}`, body);
  }
}
