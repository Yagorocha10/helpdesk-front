import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FolderTreeComponent } from './folder-tree.component';
import { SharedModule } from '../../../../shared/shared.module';

describe('FolderTreeComponent', () => {
  let component: FolderTreeComponent;
  let fixture: ComponentFixture<FolderTreeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FolderTreeComponent],
      imports: [
        HttpClientTestingModule,
        ScrollingModule,
        SharedModule
      ]
    });

    fixture = TestBed.createComponent(FolderTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
