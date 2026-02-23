import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaCliente } from './categoria-cliente';

describe('CategoriaCliente', () => {
  let component: CategoriaCliente;
  let fixture: ComponentFixture<CategoriaCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriaCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriaCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
