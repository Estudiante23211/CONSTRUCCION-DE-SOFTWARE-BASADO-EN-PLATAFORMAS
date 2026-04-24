import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CategoriaCliente } from './categoria-cliente';
import { ClientesApiService } from '../../../core/services/clientes-api.service';

describe('CategoriaCliente', () => {
  let component: CategoriaCliente;
  let fixture: ComponentFixture<CategoriaCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaCliente],
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

    fixture = TestBed.createComponent(CategoriaCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
