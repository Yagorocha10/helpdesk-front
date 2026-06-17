import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Folder } from '../models/folder.model';
import { DocumentFile } from '../models/document-file.model';
import { SearchResult } from '../models/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  // Banco de dados simulado em memória usando os Models oficiais
  private mockFolders: Folder[] = [
    { id: 1, name: 'Contratos', fileCount: 0, parentId: null },
    { id: 2, name: 'Recursos Humanos', fileCount: 0, parentId: null },
    { id: 3, name: 'Financeiro', fileCount: 0, parentId: null },
    { id: 4, name: 'Projetos', fileCount: 0, parentId: null }
  ];

  private mockDocuments: DocumentFile[] = [];

  constructor() {}

  // Listar pastas filtrando por pai (null para a raiz)
  getFolders(parentId: number | null = null): Observable<Folder[]> {
    return of(this.mockFolders.filter(f => f.parentId === parentId));
  }

  // Buscar uma pasta específica por ID
  getFolderById(id: number): Observable<Folder | undefined> {
    return of(this.mockFolders.find(f => f.id === id));
  }

  // Criar uma nova pasta ou subpasta
  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    const newFolder: Folder = {
      id: Math.floor(Math.random() * 10000),
      name: name,
      fileCount: 0,
      parentId: parentId
    };
    this.mockFolders.push(newFolder);
    return of(newFolder);
  }

  // Listar documentos de uma pasta específica
  getDocumentsByFolder(folderId: number): Observable<DocumentFile[]> {
    return of(this.mockDocuments.filter(d => d.folderId === folderId));
  }

  // Simular upload de arquivo
  uploadDocument(folderId: number, file: File): Observable<DocumentFile> {
    const newDoc: DocumentFile = {
      id: Math.floor(Math.random() * 10000),
      name: file.name,
      type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      folderId: folderId
    };
    
    this.mockDocuments.push(newDoc);
    
    // Atualiza o contador de arquivos da pasta correspondente
    const folder = this.mockFolders.find(f => f.id === folderId);
    if (folder) {
      folder.fileCount = this.mockDocuments.filter(d => d.folderId === folderId).length;
    }

    return of(newDoc);
  }

  // Remover arquivo
  deleteDocument(docId: number): Observable<void> {
    const index = this.mockDocuments.findIndex(d => d.id === docId);
    if (index !== -1) {
      const folderId = this.mockDocuments[index].folderId;
      this.mockDocuments.splice(index, 1);
      
      // Atualiza o contador da pasta após a exclusão
      const folder = this.mockFolders.find(f => f.id === folderId);
      if (folder) {
        folder.fileCount = this.mockDocuments.filter(d => d.folderId === folderId).length;
      }
    }
    return of(void 0);
  }

  // Mecanismo de busca global utilizando a interface SearchResult
  search(query: string): Observable<SearchResult> {
    const txt = query.toLowerCase().trim();
    if (!txt) return of({ folders: [], documents: [] });

    const filteredFolders = this.mockFolders.filter(f => f.name.toLowerCase().includes(txt));
    const filteredDocs = this.mockDocuments.filter(d => d.name.toLowerCase().includes(txt));

    return of({ folders: filteredFolders, documents: filteredDocs });
  }
}