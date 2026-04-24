import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Usuarios } from './usuarios';
import { UsuariosService } from '../../../core/services/usuarios.service';

describe('Usuarios', () => {
  let component: Usuarios;
  let fixture: ComponentFixture<Usuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [
        {
          provide: UsuariosService,
          useValue: {
            formOptions: () => of({ roles: [], tiposIdentificacion: [] }),
            list: () => of([]),
            create: () =>
              of({
                id: 1,
                numeroIdentificacion: '123',
                idRoles: 1,
                rolNombre: 'Admin',
                idTipoIdentificacion: 1,
                tipoIdentificacionNombre: 'Cédula',
                nombre: 'Test',
                apellido: 'User',
                correo: 't@test.com',
                celular: '',
                usuario: 'test',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2026-01-01',
              }),
            update: () =>
              of({
                id: 1,
                numeroIdentificacion: '123',
                idRoles: 1,
                rolNombre: 'Admin',
                idTipoIdentificacion: 1,
                tipoIdentificacionNombre: 'Cédula',
                nombre: 'Test',
                apellido: 'User',
                correo: 't@test.com',
                celular: '',
                usuario: 'test',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2026-01-01',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
