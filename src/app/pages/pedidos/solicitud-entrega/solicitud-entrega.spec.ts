import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudEntrega } from './solicitud-entrega';

describe('SolicitudEntrega', () => {
  let component: SolicitudEntrega;
  let fixture: ComponentFixture<SolicitudEntrega>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudEntrega]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudEntrega);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
