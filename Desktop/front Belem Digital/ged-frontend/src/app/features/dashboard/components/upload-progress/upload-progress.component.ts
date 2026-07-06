import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UploadQueueItem, UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadProgressComponent {
  readonly queue$: Observable<UploadQueueItem[]> = this.uploadService.queue$;
  readonly visibleQueue$ = this.queue$.pipe(map(items => items.slice(-5)));

  constructor(private uploadService: UploadService) {}

  clearCompleted(): void {
    this.uploadService.clearCompleted();
  }

  trackByItemId(_index: number, item: UploadQueueItem): string {
    return item.id;
  }
}
