import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Inventario } from './inventario';
import { InventarioApiService } from '../../../core/services/inventario-api.service';
import { ProductosApiService } from '../../../core/services/productos-api.service';

describe('Inventario', () => {
  let component: Inventario;
  let fixture: ComponentFixture<Inventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inventario],
      providers: [
        {
          provide: InventarioApiService,
          useValue: {
            list: () => of([]),
            create: () =>
              of({
                id: 1,
                idProducto: 1,
                idUnidadMedida: 1,
                productoNombre: 'P',
                unidadMedida: 'Unidad',
                cantidadInicial: 0,
                cantidadActual: 0,
                alertaMinima: 0,
                estado: 'Activo' as const,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            update: () =>
              of({
                id: 1,
                idProducto: 1,
                idUnidadMedida: 1,
                productoNombre: 'P',
                unidadMedida: 'Unidad',
                cantidadInicial: 0,
                cantidadActual: 0,
                alertaMinima: 0,
                estado: 'Activo' as const,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
          },
        },
        {
          provide: ProductosApiService,
          useValue: {
            productosList: () => of([]),
            catalogList: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inventario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
