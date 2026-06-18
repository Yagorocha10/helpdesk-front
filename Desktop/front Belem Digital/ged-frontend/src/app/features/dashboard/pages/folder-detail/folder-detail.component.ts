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
    this.documentService.getFolderById(this.folderId).subscribe({
      next: folder => this.currentFolder = folder,
      error: err => console.error('Erro ao carregar pasta:', err)
    });

    this.documentService.getDocumentsByFolder(this.folderId).subscribe(data => {
      this.documents = [...data];
    });

    this.documentService.getFolders(this.folderId).subscribe(subs => {
      this.subFolders = subs;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.documentService.uploadDocument(this.folderId, file).subscribe({
      next: () => {
        this.loadData();
        input.value = '';
      },
      error: err => {
        console.error('Erro ao enviar arquivo:', err);
        alert('Nao foi possivel enviar o arquivo.');
        input.value = '';
      }
    });
  }

  createSubFolder(): void {
    if (this.newSubFolderName.trim()) {
      this.documentService.addFolder(this.newSubFolderName, this.folderId).subscribe({
        next: () => {
          this.newSubFolderName = '';
          this.showSubFolderInput = false;
          this.loadData();
        },
        error: err => {
          console.error('Erro ao criar subpasta:', err);
          alert('O backend ainda nao possui suporte para subpastas.');
        }
      });
    }
  }

  downloadFile(doc: DocumentFile): void {
    try {
      this.documentService.downloadDocument(doc);
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      alert('Nao foi possivel baixar o arquivo.');
    }
  }

  deleteFile(docId: number): void {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      this.documentService.deleteDocument(docId).subscribe(() => {
        this.loadData();
      });
    }
  }
}
