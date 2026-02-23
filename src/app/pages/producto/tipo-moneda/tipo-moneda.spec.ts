import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoMoneda } from './tipo-moneda';

describe('TipoMoneda', () => {
  let component: TipoMoneda;
  let fixture: ComponentFixture<TipoMoneda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoMoneda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoMoneda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
