import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
}
