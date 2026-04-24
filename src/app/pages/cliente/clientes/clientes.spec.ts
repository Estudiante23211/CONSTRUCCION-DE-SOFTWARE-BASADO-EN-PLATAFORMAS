import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Clientes } from './clientes';
import { ClientesApiService } from '../../../core/services/clientes-api.service';

describe('Clientes', () => {
  let component: Clientes;
  let fixture: ComponentFixture<Clientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clientes],
      providers: [
        {
          provide: ClientesApiService,
          useValue: {
            clientesCatalogos: () =>
              of({
                tiposCliente: [{ id: 1, nombre: 'Natural' }],
                categoriasCliente: [{ id: 1, nombre: 'Regular' }],
                tiposIdentificacion: [{ id: 1, nombre: 'Cédula', esNit: false }],
              }),
            clientesList: () => of([]),
            clienteCreate: () =>
              of({
                id: 1,
                idTipoCliente: 1,
                tipoClienteNombre: 'Natural',
                idCategoriaCliente: 1,
                categoriaClienteNombre: 'Regular',
                idTipoIdentificacion: 1,
                tipoIdentificacionNombre: 'Cédula',
                identificacion: '1',
                nombre: 'A',
                apellidos: 'B',
                nombreComercial: '',
                razonSocial: '',
                direccion: 'C',
                celular: '1',
                correo: 'a@a.com',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            clienteUpdate: () =>
              of({
                id: 1,
                idTipoCliente: 1,
                tipoClienteNombre: 'Natural',
                idCategoriaCliente: 1,
                categoriaClienteNombre: 'Regular',
                idTipoIdentificacion: 1,
                tipoIdentificacionNombre: 'Cédula',
                identificacion: '1',
                nombre: 'A',
                apellidos: 'B',
                nombreComercial: '',
                razonSocial: '',
                direccion: 'C',
                celular: '1',
                correo: 'a@a.com',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
            clienteEliminar: () =>
              of({
                id: 1,
                idTipoCliente: 1,
                tipoClienteNombre: 'Natural',
                idCategoriaCliente: 1,
                categoriaClienteNombre: 'Regular',
                idTipoIdentificacion: 1,
                tipoIdentificacionNombre: 'Cédula',
                identificacion: '1',
                nombre: 'A',
                apellidos: 'B',
                nombreComercial: '',
                razonSocial: '',
                direccion: 'C',
                celular: '1',
                correo: 'a@a.com',
                estado: 'Eliminado' as const,
                estadoActivo: false,
                usuarioCreacion: '—',
                fechaCreacion: '2026-01-01',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Clientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
