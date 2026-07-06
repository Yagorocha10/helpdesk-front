import { Directive, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { UploadService } from '../services/upload.service';

@Directive({
  selector: '[appFolderDrop]'
})
export class FolderDropDirective {
  @Input('appFolderDrop') folderId?: number | null;
  @Input() dropDisabled = false;
  @Output() uploadCompleted = new EventEmitter<void>();

  @HostBinding('class.upload-drop-target') readonly isDropTarget = true;
  @HostBinding('class.upload-drag-active') isDragActive = false;
  @HostBinding('attr.aria-dropeffect') get dropEffect(): string | null {
    return this.isDragActive ? 'copy' : null;
  }

  constructor(private uploadService: UploadService) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    if (this.dropDisabled || !this.hasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';
    this.isDragActive = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragActive = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    if (this.dropDisabled || !this.hasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDragActive = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.uploadService.uploadFiles(files, this.folderId).subscribe({
      next: () => this.uploadCompleted.emit()
    });
  }

  private hasFiles(event: DragEvent): boolean {
    return Array.from(event.dataTransfer?.types || []).includes('Files');
  }
}
