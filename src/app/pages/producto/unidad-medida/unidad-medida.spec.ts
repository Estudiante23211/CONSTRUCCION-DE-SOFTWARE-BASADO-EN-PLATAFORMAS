import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UnidadMedida } from './unidad-medida';
import { ProductosApiService } from '../../../core/services/productos-api.service';

describe('UnidadMedida', () => {
  let component: UnidadMedida;
  let fixture: ComponentFixture<UnidadMedida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadMedida],
      providers: [
        {
          provide: ProductosApiService,
          useValue: {
            catalogList: () => of([]),
            catalogCreate: () =>
              of({
                id: 1,
                nombre: 'U',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            catalogPatch: () =>
              of({
                id: 1,
                nombre: 'U',
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

    fixture = TestBed.createComponent(UnidadMedida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
