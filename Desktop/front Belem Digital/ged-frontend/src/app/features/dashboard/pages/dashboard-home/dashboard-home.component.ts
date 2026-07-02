import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { DocumentFile } from 'src/app/core/models/document-file.model';
import { Folder } from 'src/app/core/models/folder.model';
import { SearchResult } from 'src/app/core/models/search-result.model';
import { DocumentService } from 'src/app/core/services/document.service';
import { CreateFolderDialogComponent } from '../../components/create-folder-dialog/create-folder-dialog.component';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  folders: Folder[] = [];
  searchResults: SearchResult = { folders: [], documents: [] };
  searchQuery = '';
  isSearching = false;
  selectedFolderId: number | null = null;
  deletingFolderIds = new Set<number>();
  deletingDocumentIds = new Set<number>();
  isUploadDragActive = false;
  uploadingFiles = false;

  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.documentService.getFolders(null).subscribe({
      next: data => {
        this.folders = [...data];
      },
      error: err => {
        console.error('Erro ao carregar pastas:', err);
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

  uploadFromInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);

    if (files.length > 0) {
      this.uploadFilesToSelectedFolder(files);
    }

    input.value = '';
  }

  onUploadDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isUploadDragActive = true;
  }

  onUploadDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isUploadDragActive = false;
  }

  onUploadDrop(event: DragEvent): void {
    event.preventDefault();
    this.isUploadDragActive = false;

    const files = Array.from(event.dataTransfer?.files || []);
    this.uploadFilesToSelectedFolder(files);
  }

  openCreateFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
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
            alert('Não foi possível criar a pasta. Verifique se o backend está rodando.');
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

    this.deletingFolderIds.add(folderId);

    this.documentService.deleteFolder(folderId).pipe(
      finalize(() => this.deletingFolderIds.delete(folderId))
    ).subscribe({
      next: () => {
        this.folders = this.folders.filter(item => String(item.id) !== String(folderId));
        this.searchResults = {
          folders: this.searchResults.folders.filter(item => String(item.id) !== String(folderId)),
          documents: this.searchResults.documents.filter(item => String(item.folderId) !== String(folderId))
        };
        this.isSearching && this.searchQuery.trim() ? this.onSearch() : this.loadFolders();
      },
      error: err => {
        console.error('Erro ao excluir pasta:', err);
        alert(`Não foi possível excluir a pasta. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }

  renameFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const name = window.prompt('Novo nome da pasta', folder.name);

    if (!name?.trim() || name.trim() === folder.name) {
      return;
    }

    this.documentService.renameFolder(folder.id, name).subscribe({
      next: () => {
        this.refreshAfterFolderAction();
      },
      error: err => {
        console.error('Erro ao renomear pasta:', err);
        alert('Nao foi possivel renomear a pasta.');
      }
    });
  }

  moveFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const destinationId = this.askForDestinationFolder(folder, 'Mover para qual pasta?');

    if (destinationId === undefined) {
      return;
    }

    this.documentService.moveFolder(folder, destinationId).subscribe({
      next: () => {
        this.refreshAfterFolderAction();
      },
      error: err => {
        console.error('Erro ao mover pasta:', err);
        alert('Nao foi possivel mover a pasta.');
      }
    });
  }

  shareFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const url = `${window.location.origin}${window.location.pathname}#/dashboard/folder/${folder.id}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link da pasta copiado.'))
        .catch(() => window.prompt('Copie o link da pasta:', url));
      return;
    }

    window.prompt('Copie o link da pasta:', url);
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
      alert('Não foi possível baixar o arquivo.');
    }
  }

  viewFile(doc: DocumentFile): void {
    try {
      this.documentService.viewDocument(doc);
    } catch (err) {
      console.error('Erro ao visualizar arquivo:', err);
      alert('Não foi possível visualizar o arquivo.');
    }
  }

  deleteFile(event: Event, doc: DocumentFile): void {
    event.preventDefault();
    event.stopPropagation();

    const docId = Number(doc.id);
    if (this.deletingDocumentIds.has(docId)) {
      return;
    }

    this.deletingDocumentIds.add(docId);

    this.documentService.deleteDocument(docId).pipe(
      finalize(() => this.deletingDocumentIds.delete(docId))
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
        alert(`Não foi possível excluir o arquivo. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }

  private uploadFilesToSelectedFolder(files: File[]): void {
    if (files.length === 0 || this.uploadingFiles) {
      return;
    }

    const folderId = this.askForDestinationFolder(undefined, 'Enviar arquivos para qual pasta?');

    if (folderId === undefined || folderId === null) {
      return;
    }

    this.uploadingFiles = true;

    forkJoin(files.map(file => this.documentService.uploadDocument(folderId, file))).pipe(
      finalize(() => this.uploadingFiles = false)
    ).subscribe({
      next: () => {
        this.refreshAfterFolderAction();
      },
      error: err => {
        console.error('Erro ao enviar arquivos:', err);
        alert('Nao foi possivel enviar os arquivos.');
      }
    });
  }

  private askForDestinationFolder(currentFolder: Folder | undefined, title: string): number | null | undefined {
    const folders = this.flattenFolders(this.folders)
      .filter(folder => !currentFolder || folder.id !== currentFolder.id);

    if (folders.length === 0) {
      alert('Crie uma pasta antes de usar esta acao.');
      return undefined;
    }

    const options = [
      '0 - Raiz',
      ...folders.map(folder => `${folder.id} - ${this.formatFolderName(folder.name)}`)
    ].join('\n');
    const response = window.prompt(`${title}\n\n${options}`, currentFolder ? '0' : String(folders[0].id));

    if (response === null) {
      return undefined;
    }

    const destinationId = Number(response.trim());

    if (destinationId === 0) {
      return null;
    }

    if (!folders.some(folder => folder.id === destinationId)) {
      alert('Pasta destino invalida.');
      return undefined;
    }

    return destinationId;
  }

  private refreshAfterFolderAction(): void {
    if (this.isSearching && this.searchQuery.trim()) {
      this.onSearch();
      return;
    }

    this.loadFolders();
  }

  private flattenFolders(folders: Folder[]): Folder[] {
    return folders.flatMap(folder => [folder, ...this.flattenFolders(folder.children || [])]);
  }
}
