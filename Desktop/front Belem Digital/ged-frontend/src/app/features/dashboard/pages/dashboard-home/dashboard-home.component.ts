import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, filter, finalize, switchMap, takeUntil } from 'rxjs';
import { DocumentFile } from 'src/app/core/models/document-file.model';
import { Folder } from 'src/app/core/models/folder.model';
import { SearchResult } from 'src/app/core/models/search-result.model';
import { DocumentService } from 'src/app/core/services/document.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CreateFolderDialogComponent } from '../../components/create-folder-dialog/create-folder-dialog.component';
import { FolderSelectionModalComponent } from '../../components/folder-selection-modal/folder-selection-modal.component';
import { TextInputDialogComponent } from '../../components/text-input-dialog/text-input-dialog.component';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
  folders: Folder[] = [];
  searchResults: SearchResult = { folders: [], documents: [] };
  searchQuery = '';
  isSearching = false;
  selectedFolderId: number | null = null;
  deletingFolderIds = new Set<number>();
  deletingDocumentIds = new Set<number>();

  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService,
    private router: Router,
    private snackBar: MatSnackBar,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.loadFolders();
    this.uploadService.completed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshAfterFolderAction());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFolders(): void {
    this.documentService.getFolders(null).subscribe({
      next: data => {
        this.folders = [...data];
      },
      error: err => {
        console.error('Erro ao carregar pastas:', err);
        this.showError('Nao foi possivel carregar as pastas.');
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.isSearching = true;
      this.documentService.search(this.searchQuery).subscribe({
        next: res => {
          this.searchResults = res;
        },
        error: err => {
          console.error('Erro ao pesquisar:', err);
          this.showError('Nao foi possivel pesquisar.');
        }
      });
    } else {
      this.isSearching = false;
      this.loadFolders();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.isSearching = false;
    this.searchResults = { folders: [], documents: [] };
    this.loadFolders();
  }

  formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }

  openCreateFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && result.name) {
        this.documentService.addFolder(result.name, null).subscribe({
          next: folder => {
            this.searchQuery = '';
            this.isSearching = false;
            this.folders = [...this.folders, folder];
            this.loadFolders();
          },
          error: err => {
            console.error('Erro ao criar pasta:', err);
            this.showError('Nao foi possivel criar a pasta. Verifique se o backend esta rodando.');
          }
        });
      }
    });
  }

  deleteFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const folderId = Number(folder.id);
    if (this.deletingFolderIds.has(folderId)) {
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Excluir pasta',
        message: `Excluir a pasta "${this.formatFolderName(folder.name)}"?`,
        confirmText: 'Excluir'
      }
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(() => {
        this.deletingFolderIds.add(folderId);
        return this.documentService.deleteFolder(folderId).pipe(
          finalize(() => this.deletingFolderIds.delete(folderId))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.folders = this.folders.filter(item => String(item.id) !== String(folderId));
        this.searchResults = {
          folders: this.searchResults.folders.filter(item => String(item.id) !== String(folderId)),
          documents: this.searchResults.documents.filter(item => String(item.folderId) !== String(folderId))
        };
        this.refreshAfterFolderAction();
      },
      error: err => {
        console.error('Erro ao excluir pasta:', err);
        this.showError(`Nao foi possivel excluir a pasta. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }

  renameFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Renomear pasta',
        label: 'Novo nome da pasta',
        value: folder.name,
        confirmText: 'Salvar'
      }
    }).afterClosed().pipe(
      filter((name): name is string => !!name?.trim() && name.trim() !== folder.name),
      switchMap(name => this.documentService.renameFolder(folder.id, name)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.refreshAfterFolderAction(),
      error: err => {
        console.error('Erro ao renomear pasta:', err);
        this.showError('Nao foi possivel renomear a pasta.');
      }
    });
  }

  moveFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    this.dialog.open(FolderSelectionModalComponent, {
      width: '520px',
      maxWidth: 'calc(100vw - 32px)'
    }).afterClosed().pipe(
      filter((destinationId): destinationId is number => typeof destinationId === 'number' && destinationId !== folder.id),
      switchMap(destinationId => this.documentService.moveFolder(folder, destinationId)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => this.refreshAfterFolderAction(),
      error: err => {
        console.error('Erro ao mover pasta:', err);
        this.showError('Nao foi possivel mover a pasta.');
      }
    });
  }

  shareFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}${window.location.pathname}#/dashboard/folder/${folder.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => this.snackBar.open('Link da pasta copiado.', 'Fechar', { duration: 3000 }))
        .catch(() => this.snackBar.open(url, 'Fechar', { duration: 8000 }));
      return;
    }

    this.snackBar.open(url, 'Fechar', { duration: 8000 });
  }

  goToFolder(folderId: number): void {
    this.router.navigate(['/dashboard/folder', folderId]);
  }

  onFolderTreeSelected(folder: Folder): void {
    this.selectedFolderId = folder.id;
    this.goToFolder(folder.id);
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
      switchMap(() => {
        this.deletingDocumentIds.add(docId);
        return this.documentService.deleteDocument(docId).pipe(
          finalize(() => this.deletingDocumentIds.delete(docId))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.searchResults = {
          folders: this.searchResults.folders,
          documents: this.searchResults.documents.filter(item => String(item.id) !== String(docId))
        };
        this.loadFolders();
      },
      error: err => {
        console.error('Erro ao excluir arquivo:', err);
        this.showError(`Nao foi possivel excluir o arquivo. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }

  trackByFolderId(_index: number, folder: Folder): number {
    return folder.id;
  }

  trackByDocumentId(_index: number, document: DocumentFile): number {
    return document.id;
  }

  private refreshAfterFolderAction(): void {
    if (this.isSearching && this.searchQuery.trim()) {
      this.onSearch();
      return;
    }

    this.loadFolders();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }
}
