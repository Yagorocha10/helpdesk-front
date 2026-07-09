import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-upload-dropzone',
  templateUrl: './upload-dropzone.component.html',
  styleUrls: ['./upload-dropzone.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadDropzoneComponent {
  @Input() folderId?: number | null;
  @Input() label = 'Arraste e solte arquivos aqui';
  @Input() hint = 'Upload de Arquivo';

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  readonly isUploading$: Observable<boolean> = this.uploadService.isUploading$;

  constructor(private uploadService: UploadService) {}

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    this.uploadService.uploadFiles(files, this.folderId).subscribe({
      complete: () => input.value = ''
    });
  }
}
