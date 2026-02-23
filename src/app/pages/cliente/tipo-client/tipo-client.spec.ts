import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoClient } from './tipo-client';

describe('TipoClient', () => {
  let component: TipoClient;
  let fixture: ComponentFixture<TipoClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoClient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
