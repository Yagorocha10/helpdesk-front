import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subject, filter, finalize, takeUntil } from 'rxjs';
import { DocumentFile } from '../../../../core/models/document-file.model';
import { Folder } from '../../../../core/models/folder.model';
import { DocumentService } from '../../../../core/services/document.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { UploadContextService } from '../../services/upload-context.service';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-folder-detail',
  templateUrl: './folder-detail.component.html',
  styleUrls: ['./folder-detail.component.scss']
})
export class FolderDetailComponent implements OnInit, OnDestroy {
  folderId!: number;
  currentFolder?: Folder;
  documents: DocumentFile[] = [];
  subFolders: Folder[] = [];
  displayedColumns: string[] = ['icon', 'name', 'type', 'actions'];

  newSubFolderName = '';
  showSubFolderInput = false;
  subFolderMessage = '';
  isCreatingSubFolder = false;
  deletingSubFolderIds = new Set<number>();
  deletingDocumentIds = new Set<number>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private uploadContextService: UploadContextService,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.folderId = Number(params.get('id'));
        this.uploadContextService.setCurrentFolder(this.folderId);
        this.loadData();
      });

    this.uploadService.completed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(folderId => {
        if (folderId === this.folderId || this.subFolders.some(folder => folder.id === folderId)) {
          this.loadData();
        }
      });

    this.documentService.folderChanges$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.documentService.getFolderById(this.folderId).subscribe({
      next: folder => this.currentFolder = folder,
      error: err => {
        console.error('Erro ao carregar pasta:', err);
        this.showError('Nao foi possivel carregar a pasta.');
      }
    });

    this.documentService.getDocumentsByFolder(this.folderId).subscribe({
      next: data => this.documents = [...data],
      error: err => {
        console.error('Erro ao carregar documentos:', err);
        this.showError('Nao foi possivel carregar os documentos.');
      }
    });

    this.documentService.getFolders(this.folderId).subscribe({
      next: subs => this.subFolders = subs,
      error: err => {
        console.error('Erro ao carregar subpastas:', err);
        this.showError('Nao foi possivel carregar as subpastas.');
      }
    });
  }

  createSubFolder(): void {
    const subFolderName = this.newSubFolderName.trim();

    if (!subFolderName || this.isCreatingSubFolder) {
      return;
    }

    this.isCreatingSubFolder = true;

    this.documentService.addFolder(subFolderName, this.folderId).pipe(
      finalize(() => this.isCreatingSubFolder = false)
    ).subscribe({
      next: createdFolder => {
        this.newSubFolderName = '';
        this.showSubFolderInput = false;
        this.subFolderMessage = '';
        this.subFolders = this.upsertFolder(this.subFolders, createdFolder);
      },
      error: err => {
        console.error('Erro ao criar subpasta:', err);
        this.showError('Nao foi possivel criar a subpasta. Verifique se o backend esta rodando.');
      }
    });
  }

  toggleSubFolderInput(): void {
    this.showSubFolderInput = !this.showSubFolderInput;
    this.subFolderMessage = '';

    if (!this.showSubFolderInput) {
      this.newSubFolderName = '';
    }
  }

  deleteSubFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const folderId = Number(folder.id);
    if (this.deletingSubFolderIds.has(folderId)) {
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Excluir subpasta',
        message: `Excluir a subpasta "${this.formatFolderName(folder.name)}"?`,
        confirmText: 'Excluir'
      }
    }).afterClosed().pipe(
      filter(Boolean),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.deletingSubFolderIds.add(folderId);

      this.documentService.deleteFolder(folderId).pipe(
        finalize(() => this.deletingSubFolderIds.delete(folderId))
      ).subscribe({
        next: () => {
          this.subFolders = this.subFolders.filter(item => String(item.id) !== String(folderId));
          this.loadData();
        },
        error: err => {
          console.error('Erro ao excluir subpasta:', err);
          this.showError(`Nao foi possivel excluir a subpasta. Status: ${err.status || 'sem resposta do backend'}.`);
        }
      });
    });
  }

  trackByFolderId(_index: number, folder: Folder): number {
    return folder.id;
  }

  trackByDocumentId(_index: number, document: DocumentFile): number {
    return document.id;
  }

  formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }

  downloadFile(doc: DocumentFile): void {
    try {
      this.documentService.downloadDocument(doc);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      this.showError('Nao foi possivel baixar o arquivo.');
    }
  }

  viewFile(doc: DocumentFile): void {
    try {
      this.documentService.viewDocument(doc);
    } catch (err) {
      console.error('Erro ao visualizar arquivo:', err);
      this.showError('Nao foi possivel visualizar o arquivo.');
    }
  }

  deleteFile(event: Event, doc: DocumentFile): void {
    event.preventDefault();
    event.stopPropagation();

    const docId = Number(doc.id);
    if (this.deletingDocumentIds.has(docId)) {
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Excluir arquivo',
        message: `Excluir o arquivo "${doc.name}"?`,
        confirmText: 'Excluir'
      }
    }).afterClosed().pipe(
      filter(Boolean),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.deletingDocumentIds.add(docId);

      this.documentService.deleteDocument(docId).pipe(
        finalize(() => this.deletingDocumentIds.delete(docId))
      ).subscribe({
        next: () => {
          this.documents = this.documents.filter(document => String(document.id) !== String(docId));
          this.loadData();
        },
        error: err => {
          console.error('Erro ao excluir arquivo:', err);
          this.showError(`Nao foi possivel excluir o arquivo. Status: ${err.status || 'sem resposta do backend'}.`);
        }
      });
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }

  private upsertFolder(folders: Folder[], folder: Folder): Folder[] {
    const existingIndex = folders.findIndex(item => String(item.id) === String(folder.id));

    if (existingIndex < 0) {
      return [...folders, folder];
    }

    return folders.map(item => String(item.id) === String(folder.id) ? folder : item);
  }
}
