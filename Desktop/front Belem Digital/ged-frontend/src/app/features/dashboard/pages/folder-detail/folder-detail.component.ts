import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentService } from '../../../../core/services/document.service';
import { Folder } from '../../../../core/models/folder.model';
import { DocumentFile } from '../../../../core/models/document-file.model';

@Component({
  selector: 'app-folder-detail',
  templateUrl: './folder-detail.component.html',
  styleUrls: ['./folder-detail.component.scss']
})
export class FolderDetailComponent implements OnInit {
  folderId!: number;
  currentFolder?: Folder;
  documents: DocumentFile[] = [];
  subFolders: Folder[] = [];
  displayedColumns: string[] = ['icon', 'name', 'type', 'actions'];
  
  newSubFolderName = '';
  showSubFolderInput = false;

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.folderId = Number(params.get('id'));
      this.loadData();
    });
  }

  loadData(): void {
    this.documentService.getFolderById(this.folderId).subscribe(f => this.currentFolder = f);
    
    this.documentService.getDocumentsByFolder(this.folderId).subscribe(data => {
      this.documents = [...data];
    });

    this.documentService.getFolders(this.folderId).subscribe(subs => {
      this.subFolders = subs;
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.documentService.uploadDocument(this.folderId, file).subscribe(() => {
        this.loadData();
        event.target.value = '';
      });
    }
  }

  createSubFolder(): void {
    if (this.newSubFolderName.trim()) {
      this.documentService.addFolder(this.newSubFolderName, this.folderId).subscribe(() => {
        this.newSubFolderName = '';
        this.showSubFolderInput = false;
        this.loadData();
      });
    }
  }

  downloadFile(doc: DocumentFile): void {
    const blob = new Blob(['Conteúdo simulado do arquivo'], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  deleteFile(docId: number): void {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      this.documentService.deleteDocument(docId).subscribe(() => {
        this.loadData();
      });
    }
  }
}