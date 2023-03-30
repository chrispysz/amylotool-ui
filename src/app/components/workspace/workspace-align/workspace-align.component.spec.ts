import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceAlignComponent } from './workspace-align.component';

describe('WorkspaceAlignComponent', () => {
  let component: WorkspaceAlignComponent;
  let fixture: ComponentFixture<WorkspaceAlignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceAlignComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceAlignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
