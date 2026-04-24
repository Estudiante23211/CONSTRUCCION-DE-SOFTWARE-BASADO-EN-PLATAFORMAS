import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TipoIdentificacion } from './tipo-identificacion';
import { ClientesApiService } from '../../../core/services/clientes-api.service';

describe('TipoIdentificacion', () => {
  let component: TipoIdentificacion;
  let fixture: ComponentFixture<TipoIdentificacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoIdentificacion],
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

    fixture = TestBed.createComponent(TipoIdentificacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
