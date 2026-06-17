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

  constructor(
    private folderService: FolderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRootFolders();
  }

  loadRootFolders(): void {
    // Busca apenas as pastas da raiz (parentId = null)
    this.folderService.getFolders(null).subscribe(data => {
      this.folders = data;
    });
  }

  goToFolder(id: number): void {
    this.router.navigate(['/dashboard/folder', id]);
  }
}