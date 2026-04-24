import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Roles } from './roles';
import { RolesService } from '../../../core/services/roles.service';

describe('Roles', () => {
  let component: Roles;
  let fixture: ComponentFixture<Roles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Roles],
      providers: [
        {
          provide: RolesService,
          useValue: {
            list: () => of([]),
            create: () =>
              of({
                id: 1,
                nombre: 'Test',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2025-01-01',
              }),
            update: () =>
              of({
                id: 1,
                nombre: 'Test',
                descripcion: '',
                estado: 'Activo' as const,
                estadoActivo: true,
                usuarioCreador: '—',
                fechaCreacion: '2025-01-01',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Roles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
