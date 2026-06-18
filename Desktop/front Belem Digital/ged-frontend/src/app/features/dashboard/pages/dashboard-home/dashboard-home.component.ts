import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
            alert('Nao foi possivel criar a pasta. Verifique se o backend esta rodando.');
          }
        });
      }
    });
  }

  deleteFolder(event: MouseEvent, folder: Folder): void {
    event.stopPropagation();

    if (!confirm(`Tem certeza que deseja excluir a pasta "${folder.name}"?`)) {
      return;
    }

    this.documentService.deleteFolder(folder.id).subscribe({
      next: () => {
        this.folders = this.folders.filter(item => item.id !== folder.id);
        this.searchResults = {
          folders: this.searchResults.folders.filter(item => item.id !== folder.id),
          documents: this.searchResults.documents.filter(item => item.folderId !== folder.id)
        };
      },
      error: err => {
        console.error('Erro ao excluir pasta:', err);
        alert('Nao foi possivel excluir a pasta.');
      }
    });
  }

  goToFolder(folderId: number): void {
    this.router.navigate(['/dashboard/folder', folderId]);
  }

  downloadFile(doc: DocumentFile): void {
    try {
      this.documentService.downloadDocument(doc);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      alert('Nao foi possivel baixar o arquivo.');
    }
  }
}
