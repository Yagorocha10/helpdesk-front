import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DocumentService, Folder } from 'src/app/core/services/document.service';
import { CreateFolderDialogComponent } from '../../components/create-folder-dialog/create-folder-dialog.component';

@Component({
  selector: 'app-dashboard-home',
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.scss']
})
export class DashboardHomeComponent implements OnInit {
  folders: Folder[] = [];

  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.documentService.getFolders().subscribe(data => {
      this.folders = data;
    });
  }

  openCreateFolderDialog(): void {
    const dialogRef = this.dialog.open(CreateFolderDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.documentService.addFolder(result);
      }
    });
  }

  goToFolder(folderId: number): void {
    this.router.navigate(['/dashboard/folder', folderId]);
  }
}