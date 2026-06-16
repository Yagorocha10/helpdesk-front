import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderDetailComponent } from './folder-detail.component';

describe('FolderDetailComponent', () => {
  let component: FolderDetailComponent;
  let fixture: ComponentFixture<FolderDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FolderDetailComponent]
    });
    fixture = TestBed.createComponent(FolderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
