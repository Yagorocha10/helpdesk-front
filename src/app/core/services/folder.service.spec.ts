import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FolderService } from './folder.service';

describe('FolderService', () => {
  let service: FolderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(FolderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
