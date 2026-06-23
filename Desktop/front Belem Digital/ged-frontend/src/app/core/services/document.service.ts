import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { Folder } from '../models/folder.model';
import { DocumentFile } from '../models/document-file.model';
import { SearchResult } from '../models/search-result.model';

interface FolderResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string;
  parentId?: number | null;
  children?: FolderResponseDTO[];
}

interface DocumentResponseDTO {
  id: number;
  nome: string;
  tipo: string;
  folderId: number;
  mimeType: string;
  tamanho: number;
  dataCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly foldersUrl = 'http://localhost:8080/folders';
  private readonly documentsUrl = 'http://localhost:8080/documents';

  constructor(private http: HttpClient) {}

  getFolders(parentId: number | null = null): Observable<Folder[]> {
    return forkJoin({
      folders: this.http.get<FolderResponseDTO[]>(this.foldersUrl, {
        params: parentId !== null ? { parentId } : {}
      }),
      documents: this.getAllDocumentsRaw().pipe(catchError(() => of([] as DocumentResponseDTO[])))
    }).pipe(
      map(({ folders, documents }) => {
        const mappedFolders = folders.map(folder => this.mapFolder(folder, documents));
        return this.filterFoldersByParent(mappedFolders, parentId);
      })
    );
  }

  getFolderById(id: number): Observable<Folder | undefined> {
    return forkJoin({
      folder: this.http.get<FolderResponseDTO>(`${this.foldersUrl}/${id}`),
      documents: this.getDocumentsByFolderRaw(id).pipe(catchError(() => of([] as DocumentResponseDTO[])))
    }).pipe(
      map(({ folder, documents }) => this.mapFolder(folder, documents))
    );
  }

  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    const payload: { nome: string; parentId?: number } = { nome: name.trim() };

    if (parentId !== null) {
      payload.parentId = parentId;
    }

    return this.http.post<FolderResponseDTO>(this.foldersUrl, payload).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  deleteFolder(folderId: number): Observable<void> {
    return this.http.delete<void>(`${this.foldersUrl}/${folderId}`);
  }

  getDocumentsByFolder(folderId: number): Observable<DocumentFile[]> {
    return this.getDocumentsByFolderRaw(folderId).pipe(
      map(documents => documents.map(doc => this.mapDocument(doc)))
    );
  }

  uploadDocument(folderId: number, file: File): Observable<DocumentFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DocumentResponseDTO>(`${this.foldersUrl}/${folderId}/documents`, formData).pipe(
      map(doc => this.mapDocument(doc))
    );
  }

  deleteDocument(docId: number): Observable<void> {
    return this.http.delete<void>(`${this.documentsUrl}/${docId}`);
  }

  downloadDocument(doc: DocumentFile): void {
    const link = document.createElement('a');
    link.href = `${this.documentsUrl}/${doc.id}/download`;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  viewDocument(doc: DocumentFile): void {
    const previewWindow = window.open(`${this.documentsUrl}/${doc.id}/view`, '_blank');
    if (!previewWindow) {
      throw new Error('O navegador bloqueou a abertura da visualizacao.');
    }
  }

  search(query: string): Observable<SearchResult> {
    const txt = query.toLowerCase().trim();
    if (!txt) return of({ folders: [], documents: [] });

    return forkJoin({
      folders: this.getFolders(),
      documents: this.getAllDocumentsRaw()
    }).pipe(
      map(({ folders, documents }) => ({
        folders: this.flattenFolders(folders).filter(folder => folder.name.toLowerCase().includes(txt)),
        documents: documents
          .map(doc => this.mapDocument(doc))
          .filter(doc => doc.name.toLowerCase().includes(txt))
      }))
    );
  }

  private getAllDocumentsRaw(): Observable<DocumentResponseDTO[]> {
    return this.http.get<DocumentResponseDTO[]>(this.documentsUrl);
  }

  private getDocumentsByFolderRaw(folderId: number): Observable<DocumentResponseDTO[]> {
    return this.http.get<DocumentResponseDTO[]>(`${this.foldersUrl}/${folderId}/documents`);
  }

  private mapFolder(
    folder: FolderResponseDTO,
    documents: DocumentResponseDTO[] = [],
    parentIdFallback: number | null = null
  ): Folder {
    const fileCount = documents.filter(doc => String(doc.folderId) === String(folder.id)).length;
    const children = (folder.children || []).map(child => this.mapFolder(child, documents, folder.id));

    return {
      id: folder.id,
      name: folder.nome,
      fileCount,
      parentId: folder.parentId ?? parentIdFallback,
      children,
      createdAt: folder.dataCriacao
    };
  }

  private filterFoldersByParent(folders: Folder[], parentId: number | null): Folder[] {
    const candidates = parentId === null ? folders : this.flattenFolders(folders);
    return candidates.filter(folder => (folder.parentId ?? null) === parentId);
  }

  private flattenFolders(folders: Folder[]): Folder[] {
    return folders.flatMap(folder => [folder, ...this.flattenFolders(folder.children || [])]);
  }

  private mapDocument(doc: DocumentResponseDTO): DocumentFile {
    return {
      id: doc.id,
      name: doc.nome,
      type: doc.tipo,
      folderId: doc.folderId,
      mimeType: doc.mimeType,
      size: doc.tamanho,
      createdAt: doc.dataCriacao
    };
  }
}
