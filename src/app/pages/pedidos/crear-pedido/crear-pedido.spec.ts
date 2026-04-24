import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CrearPedido } from './crear-pedido';
import { PedidosApiService } from '../../../core/services/pedidos-api.service';
import { ClientesApiService } from '../../../core/services/clientes-api.service';
import { ProductosApiService } from '../../../core/services/productos-api.service';
import { UsuariosService } from '../../../core/services/usuarios.service';

describe('CrearPedido', () => {
  let component: CrearPedido;
  let fixture: ComponentFixture<CrearPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPedido],
      providers: [
        {
          provide: PedidosApiService,
          useValue: {
            pedidosList: () => of([]),
            pedidoCreate: () => of({}),
            pedidoDetalleUpdate: () => of({}),
            pedidoCancelar: () => of([]),
            pedidoEstadoUpdate: () => of([]),
          },
        },
        {
          provide: ClientesApiService,
          useValue: {
            clientesList: () => of([]),
          },
        },
        {
          provide: ProductosApiService,
          useValue: {
            productosList: () => of([]),
            catalogList: () => of([]),
          },
        },
        {
          provide: UsuariosService,
          useValue: {
            list: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
