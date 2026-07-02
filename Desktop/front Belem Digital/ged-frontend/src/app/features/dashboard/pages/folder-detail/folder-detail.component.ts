import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
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
  subFolderMessage = '';
  isCreatingSubFolder = false;
  deletingSubFolderIds = new Set<number>();
  deletingDocumentIds = new Set<number>();

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
        alert('Não foi possível enviar o arquivo.');
        input.value = '';
      }
    });
  }

  createSubFolder(): void {
    const subFolderName = this.newSubFolderName.trim();

    if (!subFolderName || this.isCreatingSubFolder) {
      return;
    }

    this.isCreatingSubFolder = true;

    this.documentService.addFolder(subFolderName, this.folderId).pipe(
      finalize(() => this.isCreatingSubFolder = false)
    ).subscribe({
      next: () => {
        this.newSubFolderName = '';
        this.showSubFolderInput = false;
        this.subFolderMessage = '';
        this.loadData();
      },
      error: err => {
        console.error('Erro ao criar subpasta:', err);
        alert('Não foi possível criar a subpasta. Verifique se o backend está rodando.');
      }
    });
  }

  toggleSubFolderInput(): void {
    this.showSubFolderInput = !this.showSubFolderInput;
    this.subFolderMessage = '';

    if (!this.showSubFolderInput) {
      this.newSubFolderName = '';
    }
  }

  deleteSubFolder(event: Event, folder: Folder): void {
    event.preventDefault();
    event.stopPropagation();

    const folderId = Number(folder.id);
    if (this.deletingSubFolderIds.has(folderId)) {
      return;
    }

    this.deletingSubFolderIds.add(folderId);

    this.documentService.deleteFolder(folderId).pipe(
      finalize(() => this.deletingSubFolderIds.delete(folderId))
    ).subscribe({
      next: () => {
        this.subFolders = this.subFolders.filter(item => String(item.id) !== String(folderId));
        this.loadData();
      },
      error: err => {
        console.error('Erro ao excluir subpasta:', err);
        alert(`Não foi possível excluir a subpasta. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }

  trackByFolderId(_index: number, folder: Folder): number {
    return folder.id;
  }

  formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
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
        this.documents = this.documents.filter(doc => String(doc.id) !== String(docId));
        this.loadData();
      },
      error: err => {
        console.error('Erro ao excluir arquivo:', err);
        alert(`Não foi possível excluir o arquivo. Status: ${err.status || 'sem resposta do backend'}.`);
      }
    });
  }
}
