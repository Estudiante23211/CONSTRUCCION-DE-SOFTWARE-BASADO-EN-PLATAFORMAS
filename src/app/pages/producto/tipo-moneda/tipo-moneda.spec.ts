import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TipoMoneda } from './tipo-moneda';
import { ProductosApiService } from '../../../core/services/productos-api.service';

describe('TipoMoneda', () => {
  let component: TipoMoneda;
  let fixture: ComponentFixture<TipoMoneda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoMoneda],
      providers: [
        {
          provide: ProductosApiService,
          useValue: {
            catalogList: () => of([]),
            catalogCreate: () =>
              of({
                id: 1,
                nombre: 'COP',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            catalogPatch: () =>
              of({
                id: 1,
                nombre: 'COP',
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

    fixture = TestBed.createComponent(TipoMoneda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
