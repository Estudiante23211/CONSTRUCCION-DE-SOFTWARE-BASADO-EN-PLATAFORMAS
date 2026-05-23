import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
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
  private listCache$?: Observable<RolApi[]>;

  constructor(private http: HttpClient) {}

  list(): Observable<RolApi[]> {
    if (!this.listCache$) {
      this.listCache$ = this.http.get<RolApi[]>(this.base).pipe(shareReplay(1));
    }
    return this.listCache$;
  }

  invalidateListCache(): void {
    this.listCache$ = undefined;
  }

  create(body: { nombre: string; descripcion?: string }): Observable<RolApi> {
    this.invalidateListCache();
    return this.http.post<RolApi>(this.base, body);
  }

  update(
    id: number,
    body: { nombre?: string; descripcion?: string; estadoActivo?: boolean }
  ): Observable<RolApi> {
    this.invalidateListCache();
    return this.http.patch<RolApi>(`${this.base}/${id}`, body);
  }
}
