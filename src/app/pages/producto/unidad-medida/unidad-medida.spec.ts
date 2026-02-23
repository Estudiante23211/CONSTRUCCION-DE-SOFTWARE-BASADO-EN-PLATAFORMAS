import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnidadMedida } from './unidad-medida';

describe('UnidadMedida', () => {
  let component: UnidadMedida;
  let fixture: ComponentFixture<UnidadMedida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadMedida]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnidadMedida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
