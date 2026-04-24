import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface InventarioApiRow {
  id: number;
  idProducto: number;
  idUnidadMedida: number;
  productoNombre: string;
  unidadMedida: string;
  cantidadInicial: number;
  cantidadActual: number;
  alertaMinima: number;
  estado: 'Activo' | 'Inactivo';
  usuarioCreacion: string;
  fechaCreacion: string;
}

export type InventarioPantalla = InventarioApiRow;

@Injectable({ providedIn: 'root' })
export class InventarioApiService {
  private readonly base = `${environment.apiUrl}/inventario`;

  constructor(private http: HttpClient) {}

  list(): Observable<InventarioPantalla[]> {
    return this.http.get<InventarioPantalla[]>(`${this.base}`);
  }

  create(body: {
    idProducto: number;
    idUnidadMedida: number;
    cantidadInicial: number;
    cantidadActual: number;
    alertaMinima: number;
  }): Observable<InventarioPantalla> {
    return this.http.post<InventarioPantalla>(`${this.base}`, body);
  }

  update(
    id: number,
    body: {
      idProducto: number;
      idUnidadMedida: number;
      cantidadInicial: number;
      cantidadActual: number;
      alertaMinima: number;
    }
  ): Observable<InventarioPantalla> {
    return this.http.patch<InventarioPantalla>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
