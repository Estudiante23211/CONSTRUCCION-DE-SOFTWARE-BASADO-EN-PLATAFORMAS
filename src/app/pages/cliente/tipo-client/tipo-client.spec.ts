import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TipoClient } from './tipo-client';
import { ClientesApiService } from '../../../core/services/clientes-api.service';

describe('TipoClient', () => {
  let component: TipoClient;
  let fixture: ComponentFixture<TipoClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoClient],
      providers: [
        {
          provide: ClientesApiService,
          useValue: {
            catalogoList: () => of([]),
            catalogoCreate: () =>
              of({
                id: 1,
                nombre: 'X',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2026-01-01',
              }),
            catalogoUpdate: () =>
              of({
                id: 1,
                nombre: 'X',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2026-01-01',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TipoClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
