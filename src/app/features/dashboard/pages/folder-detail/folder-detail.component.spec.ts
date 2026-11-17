import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { EMPTY, of } from 'rxjs';
import { DocumentService } from '../../../../core/services/document.service';
import { UploadContextService } from '../../services/upload-context.service';
import { UploadService } from '../../services/upload.service';
import { DashboardModule } from '../../dashboard.module';

import { FolderDetailComponent } from './folder-detail.component';

describe('FolderDetailComponent', () => {
  let component: FolderDetailComponent;
  let fixture: ComponentFixture<FolderDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: '1' })) }
        },
        {
          provide: DocumentService,
          useValue: {
            folderChanges$: EMPTY,
            getFolderById: () => of(undefined),
            getDocumentsByFolder: () => of([]),
            getFolders: () => of([])
          }
        },
        { provide: UploadService, useValue: { completed$: EMPTY } },
        { provide: UploadContextService, useValue: { setCurrentFolder: jasmine.createSpy() } }
      ]
    });
    fixture = TestBed.createComponent(FolderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
