import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Productos } from './productos';
import { ProductosApiService } from '../../../core/services/productos-api.service';

describe('Productos', () => {
  let component: Productos;
  let fixture: ComponentFixture<Productos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productos],
      providers: [
        {
          provide: ProductosApiService,
          useValue: {
            catalogList: () => of([]),
            productosList: () => of([]),
            productoCreate: () =>
              of({
                id: 1,
                codigo: 'X',
                idCategoria: 1,
                categoriaNombre: '—',
                nombre: 'P',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            productoUpdate: () =>
              of({
                id: 1,
                codigo: 'X',
                idCategoria: 1,
                categoriaNombre: '—',
                nombre: 'P',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Productos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
