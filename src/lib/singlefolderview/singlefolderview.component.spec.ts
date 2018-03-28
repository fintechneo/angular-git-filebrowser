import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglefolderviewComponent } from './singlefolderview.component';

describe('SinglefolderviewComponent', () => {
  let component: SinglefolderviewComponent;
  let fixture: ComponentFixture<SinglefolderviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SinglefolderviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SinglefolderviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
