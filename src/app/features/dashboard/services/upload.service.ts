import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, EMPTY, Observable, Subject, catchError, concatMap, finalize, from, map, of, tap, toArray } from 'rxjs';
import { DocumentFile } from 'src/app/core/models/document-file.model';
import { DocumentService } from 'src/app/core/services/document.service';
import { FolderSelectionModalComponent } from '../components/folder-selection-modal/folder-selection-modal.component';
import { UploadContextService } from './upload-context.service';

export type UploadStatus = 'queued' | 'uploading' | 'success' | 'error';

export interface UploadQueueItem {
  id: string;
  fileName: string;
  folderId: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface UploadRequest {
  files: File[];
  folderId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly queueSubject = new BehaviorSubject<UploadQueueItem[]>([]);
  private readonly completedSubject = new Subject<number>();
  private activeUploads = 0;

  readonly queue$ = this.queueSubject.asObservable();
  readonly completed$ = this.completedSubject.asObservable();
  readonly isUploading$ = this.queue$.pipe(
    map(items => items.some(item => item.status === 'queued' || item.status === 'uploading'))
  );

  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private uploadContext: UploadContextService
  ) {}

  uploadFiles(files: File[] | FileList, folderId?: number | null): Observable<DocumentFile[]> {
    const selectedFiles = Array.from(files || []);

    if (selectedFiles.length === 0) {
      return of([]);
    }

    const resolvedFolderId = folderId ?? this.uploadContext.currentFolderId;

    if (resolvedFolderId === null || resolvedFolderId === undefined) {
      return this.openFolderPicker().pipe(
        concatMap(selectedFolderId => {
          if (selectedFolderId === null || selectedFolderId === undefined) {
            return EMPTY;
          }

          return this.uploadToFolder(selectedFiles, selectedFolderId);
        })
      );
    }

    return this.uploadToFolder(selectedFiles, resolvedFolderId);
  }

  clearCompleted(): void {
    this.queueSubject.next(this.queueSubject.value.filter(item => item.status !== 'success'));
  }

  private openFolderPicker(): Observable<number | null | undefined> {
    const dialogRef = this.dialog.open(FolderSelectionModalComponent, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'dialog',
      restoreFocus: true
    });

    return dialogRef.afterClosed();
  }

  private uploadToFolder(files: File[], folderId: number): Observable<DocumentFile[]> {
    const items = files.map(file => this.createQueueItem(file, folderId));
    this.activeUploads += files.length;
    this.queueSubject.next([...this.queueSubject.value, ...items]);
    this.snackBar.open(this.getStartMessage(files.length), 'Fechar', { duration: 3500 });

    return from(files.map((file, index) => ({ file, item: items[index] }))).pipe(
      concatMap(({ file, item }) => {
        this.patchQueueItem(item.id, { status: 'uploading', progress: 8 });

        return this.documentService.uploadDocument(folderId, file).pipe(
          tap(() => this.patchQueueItem(item.id, { status: 'success', progress: 100 })),
          catchError(error => {
            this.patchQueueItem(item.id, {
              status: 'error',
              progress: 100,
              error: this.getErrorMessage(error)
            });
            return EMPTY;
          }),
          finalize(() => {
            this.activeUploads = Math.max(0, this.activeUploads - 1);
          })
        );
      }),
      toArray(),
      tap(documents => {
        const failedCount = this.queueSubject.value.filter(item =>
          items.some(uploadItem => uploadItem.id === item.id) && item.status === 'error'
        ).length;

        if (documents.length > 0) {
          this.completedSubject.next(folderId);
        }

        this.snackBar.open(this.getFinishMessage(documents.length, failedCount), 'Fechar', { duration: 5000 });
      })
    );
  }

  private createQueueItem(file: File, folderId: number): UploadQueueItem {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: file.name,
      folderId,
      progress: 0,
      status: 'queued'
    };
  }

  private patchQueueItem(id: string, patch: Partial<UploadQueueItem>): void {
    this.queueSubject.next(this.queueSubject.value.map(item =>
      item.id === id ? { ...item, ...patch } : item
    ));
  }

  private getStartMessage(count: number): string {
    return count === 1 ? 'Upload iniciado.' : `${count} uploads iniciados.`;
  }

  private getFinishMessage(successCount: number, failedCount: number): string {
    if (failedCount > 0 && successCount > 0) {
      return `${successCount} arquivo(s) enviado(s), ${failedCount} com erro.`;
    }

    if (failedCount > 0) {
      return 'Nao foi possivel enviar os arquivos.';
    }

    return successCount === 1 ? 'Arquivo enviado com sucesso.' : `${successCount} arquivos enviados com sucesso.`;
  }

  private getErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error && 'status' in error) {
      return `Falha no upload. Status: ${(error as { status?: number }).status || 'sem resposta'}.`;
    }

    return 'Falha no upload.';
  }
}
