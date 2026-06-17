import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DocumentService } from 'src/app/core/services/document.service';
import { CreateFolderDialogComponent } from '../../components/create-folder-dialog/create-folder-dialog.component';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  folders: any[] = [];
  searchResults: { folders: any[], documents: any[] } = { folders: [], documents: [] };
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
    this.documentService.getFolders(null).subscribe(data => {
      this.folders = [...data]; // Garante atualização reativa na tela inicial
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.isSearching = true;
      this.documentService.search(this.searchQuery).subscribe(res => {
        this.searchResults = res;
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
        this.documentService.addFolder(result.name, null).subscribe(() => {
          this.loadFolders(); // Faz a nova pasta aparecer na hora na tela inicial
        });
      }
    });
  }

  goToFolder(folderId: number): void {
    this.router.navigate(['/dashboard/folder', folderId]);
  }
  
  downloadFile(doc: any): void {
    const blob = new Blob(['Conteúdo simulado'], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
  }
}