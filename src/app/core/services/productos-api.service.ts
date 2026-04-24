import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Recursos catálogo bajo `/api/productos/`. */
export type RecursoCatalogoProducto = 'unidades-medida' | 'tipos-moneda' | 'categorias-producto';

export interface ProductoCatalogoApiItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreador: string;
  fechaCreacion: string;
}

/** Formato usado en pantallas (usuarioCreacion). */
export interface CatalogoProductoPantalla {
  id: number;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreacion: string;
  fechaCreacion: string;
}

export interface ProductoApiRow {
  id: number;
  codigo: string;
  idCategoria: number | null;
  categoriaNombre: string;
  unidadMedidaNombre?: string;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreador: string;
  fechaCreacion: string;
}

export interface ProductoPantalla {
  id: number;
  codigo: string;
  idCategoria: number | null;
  categoriaNombre: string;
  unidadMedidaNombre: string;
  nombre: string;
  descripcion: string;
  estado: 'Activo' | 'Inactivo';
  estadoActivo: boolean;
  usuarioCreacion: string;
  fechaCreacion: string;
}

function mapCatalogoPantalla(x: ProductoCatalogoApiItem): CatalogoProductoPantalla {
  return {
    id: x.id,
    nombre: x.nombre,
    descripcion: x.descripcion ?? '',
    estado: x.estado,
    estadoActivo: x.estadoActivo,
    usuarioCreacion: x.usuarioCreador,
    fechaCreacion: x.fechaCreacion,
  };
}

function mapProductoPantalla(p: ProductoApiRow): ProductoPantalla {
  return {
    id: p.id,
    codigo: p.codigo ?? '',
    idCategoria: p.idCategoria,
    categoriaNombre: p.categoriaNombre,
    unidadMedidaNombre: p.unidadMedidaNombre?.trim() ? String(p.unidadMedidaNombre).trim() : '—',
    nombre: p.nombre,
    descripcion: p.descripcion ?? '',
    estado: p.estado,
    estadoActivo: p.estadoActivo,
    usuarioCreacion: p.usuarioCreador,
    fechaCreacion: p.fechaCreacion,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductosApiService {
  private readonly base = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  catalogList(recurso: RecursoCatalogoProducto): Observable<CatalogoProductoPantalla[]> {
    return this.http
      .get<ProductoCatalogoApiItem[]>(`${this.base}/${recurso}`)
      .pipe(map((rows) => rows.map(mapCatalogoPantalla)));
  }

  catalogCreate(
    recurso: RecursoCatalogoProducto,
    body: { nombre: string; descripcion?: string }
  ): Observable<CatalogoProductoPantalla> {
    return this.http
      .post<ProductoCatalogoApiItem>(`${this.base}/${recurso}`, body)
      .pipe(map(mapCatalogoPantalla));
  }

  catalogPatch(
    recurso: RecursoCatalogoProducto,
    id: number,
    body: { nombre?: string; descripcion?: string; estadoActivo?: boolean }
  ): Observable<CatalogoProductoPantalla> {
    return this.http
      .patch<ProductoCatalogoApiItem>(`${this.base}/${recurso}/${id}`, body)
      .pipe(map(mapCatalogoPantalla));
  }

  productosList(): Observable<ProductoPantalla[]> {
    return this.http
      .get<ProductoApiRow[]>(`${this.base}/productos`)
      .pipe(map((rows) => rows.map(mapProductoPantalla)));
  }

  productoCreate(body: {
    codigo: string;
    idCategoria: number;
    nombre: string;
    descripcion?: string;
  }): Observable<ProductoPantalla> {
    return this.http
      .post<ProductoApiRow>(`${this.base}/productos`, body)
      .pipe(map(mapProductoPantalla));
  }

  productoUpdate(
    id: number,
    body: {
      codigo?: string;
      idCategoria?: number;
      nombre?: string;
      descripcion?: string;
      estadoActivo?: boolean;
    }
  ): Observable<ProductoPantalla> {
    return this.http
      .patch<ProductoApiRow>(`${this.base}/productos/${id}`, body)
      .pipe(map(mapProductoPantalla));
  }
}
