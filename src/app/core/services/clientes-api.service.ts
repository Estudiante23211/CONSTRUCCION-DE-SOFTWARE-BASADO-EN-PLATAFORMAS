import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CatalogoClienteRecurso = 'tipos-cliente' | 'categorias' | 'tipos-identificacion';

export interface ClienteCatalogoItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreador: string;
  fechaCreacion: string;
}

export interface TipoIdentificacionOpcion {
  id: number;
  nombre: string;
  esNit: boolean;
}

export interface ClientesFormCatalogos {
  tiposCliente: { id: number; nombre: string }[];
  categoriasCliente: { id: number; nombre: string }[];
  tiposIdentificacion: TipoIdentificacionOpcion[];
}

export interface ClienteApi {
  id: number;
  idTipoCliente: number | null;
  tipoClienteNombre: string;
  idCategoriaCliente: number | null;
  categoriaClienteNombre: string;
  idTipoIdentificacion: number | null;
  tipoIdentificacionNombre: string;
  identificacion: string;
  digitoVerificacion?: string;
  nombre: string;
  apellidos: string;
  nombreComercial: string;
  razonSocial: string;
  direccion: string;
  celular: string;
  correo: string;
  estado: 'Activo' | 'Eliminado';
  estadoActivo: boolean;
  usuarioCreacion: string;
  fechaCreacion: string;
}

@Injectable({ providedIn: 'root' })
export class ClientesApiService {
  private readonly root = `${environment.apiUrl}/clientes`;
  private readonly clientesBase = `${this.root}/clientes`;
  private readonly catalogCache = new Map<CatalogoClienteRecurso, Observable<ClienteCatalogoItem[]>>();
  private catalogosFormCache$?: Observable<ClientesFormCatalogos>;

  constructor(private http: HttpClient) {}

  catalogoList(recurso: CatalogoClienteRecurso): Observable<ClienteCatalogoItem[]> {
    let cached = this.catalogCache.get(recurso);
    if (!cached) {
      cached = this.http
        .get<ClienteCatalogoItem[]>(`${this.root}/${recurso}`)
        .pipe(shareReplay(1));
      this.catalogCache.set(recurso, cached);
    }
    return cached;
  }

  invalidateCatalogoCache(recurso?: CatalogoClienteRecurso): void {
    if (recurso) this.catalogCache.delete(recurso);
    else this.catalogCache.clear();
    this.catalogosFormCache$ = undefined;
  }

  catalogoCreate(
    recurso: CatalogoClienteRecurso,
    body: { nombre: string; descripcion?: string }
  ): Observable<ClienteCatalogoItem> {
    this.invalidateCatalogoCache(recurso);
    return this.http.post<ClienteCatalogoItem>(`${this.root}/${recurso}`, body);
  }

  catalogoUpdate(
    recurso: CatalogoClienteRecurso,
    id: number,
    body: { nombre?: string; descripcion?: string; estadoActivo?: boolean }
  ): Observable<ClienteCatalogoItem> {
    this.invalidateCatalogoCache(recurso);
    return this.http.patch<ClienteCatalogoItem>(`${this.root}/${recurso}/${id}`, body);
  }

  clientesCatalogos(): Observable<ClientesFormCatalogos> {
    if (!this.catalogosFormCache$) {
      this.catalogosFormCache$ = this.http
        .get<ClientesFormCatalogos>(`${this.clientesBase}/catalogos`)
        .pipe(shareReplay(1));
    }
    return this.catalogosFormCache$;
  }

  clientesList(): Observable<ClienteApi[]> {
    return this.http.get<ClienteApi[]>(this.clientesBase);
  }

  clienteCreate(body: Record<string, unknown>): Observable<ClienteApi> {
    return this.http.post<ClienteApi>(this.clientesBase, body);
  }

  clienteUpdate(id: number, body: Record<string, unknown>): Observable<ClienteApi> {
    return this.http.patch<ClienteApi>(`${this.clientesBase}/${id}`, body);
  }

  clienteEliminar(id: number): Observable<ClienteApi> {
    return this.http.patch<ClienteApi>(`${this.clientesBase}/${id}`, {
      eliminar: true,
    });
  }
}
