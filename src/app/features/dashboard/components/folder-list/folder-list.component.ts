import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FolderService } from '../../../../core/services/folder.service';
import { Folder } from '../../../../core/models/folder.model';

@Component({
  selector: 'app-folder-list',
  templateUrl: './folder-list.component.html',
  styleUrls: ['./folder-list.component.scss']
})
export class FolderListComponent implements OnInit {

  folders: Folder[] = [];
  searchTerm = '';

  constructor(
    private folderService: FolderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.folderService.getFolders().subscribe({
      next: (folders) => {
        this.folders = folders;
      },
      error: (err) => {
        console.error('Erro ao carregar pastas:', err);
      }
    });
  }

  createFolder(name: string): void {
    if (!name.trim()) {
      return;
    }

    this.folderService.addFolder(name).subscribe({
      next: () => {
        this.loadFolders();
      },
      error: (err) => {
        console.error('Erro ao criar pasta:', err);
      }
    });
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.loadFolders();
      return;
    }

    this.folderService.searchFolders(this.searchTerm).subscribe({
      next: (folders) => {
        this.folders = folders;
      },
      error: (err) => {
        console.error('Erro na pesquisa:', err);
      }
    });
  }

  goToFolder(folderId: number): void {
    this.router.navigate(['/dashboard/folder', folderId]);
  }
}
