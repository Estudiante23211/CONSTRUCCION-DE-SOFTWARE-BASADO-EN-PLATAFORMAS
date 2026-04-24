import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Categorias } from './categorias';
import { ProductosApiService } from '../../../core/services/productos-api.service';

describe('Categorias', () => {
  let component: Categorias;
  let fixture: ComponentFixture<Categorias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categorias],
      providers: [
        {
          provide: ProductosApiService,
          useValue: {
            catalogList: () => of([]),
            catalogCreate: () =>
              of({
                id: 1,
                nombre: 'Cat',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            catalogPatch: () =>
              of({
                id: 1,
                nombre: 'Cat',
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

    fixture = TestBed.createComponent(Categorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
