import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SequenceDialogComponent } from './sequence-dialog.component';

describe('SequenceDialogComponent', () => {
  let component: SequenceDialogComponent;
  let fixture: ComponentFixture<SequenceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SequenceDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SequenceDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
