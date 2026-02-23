import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoIdentificacion } from './tipo-identificacion';

describe('TipoIdentificacion', () => {
  let component: TipoIdentificacion;
  let fixture: ComponentFixture<TipoIdentificacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoIdentificacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoIdentificacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
