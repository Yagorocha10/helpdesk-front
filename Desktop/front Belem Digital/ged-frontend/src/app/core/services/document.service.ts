import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap, throwError } from 'rxjs';
import { Folder } from '../models/folder.model';
import { DocumentFile } from '../models/document-file.model';
import { SearchResult } from '../models/search-result.model';

interface FolderResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly foldersUrl = 'http://localhost:8080/folders';
  private readonly documentsStorageKey = 'ged-documents';

  constructor(private http: HttpClient) {}

  getFolders(parentId: number | null = null): Observable<Folder[]> {
    if (parentId !== null) {
      return of([]);
    }

    return this.http.get<FolderResponseDTO[]>(this.foldersUrl).pipe(
      map(folders => folders.map(folder => this.mapFolder(folder)))
    );
  }

  getFolderById(id: number): Observable<Folder | undefined> {
    return this.http.get<FolderResponseDTO>(`${this.foldersUrl}/${id}`).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    if (parentId !== null) {
      return throwError(() => new Error('O backend ainda nao suporta subpastas.'));
    }

    return this.http.post<FolderResponseDTO>(this.foldersUrl, { nome: name }).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  deleteFolder(folderId: number): Observable<void> {
    return this.http.delete<void>(`${this.foldersUrl}/${folderId}`).pipe(
      tap(() => {
        const docs = this.loadDocuments().filter(doc => doc.folderId !== folderId);
        this.saveDocuments(docs);
      })
    );
  }

  getDocumentsByFolder(folderId: number): Observable<DocumentFile[]> {
    return of(this.loadDocuments().filter(doc => doc.folderId === folderId));
  }

  uploadDocument(folderId: number, file: File): Observable<DocumentFile> {
    return new Observable<DocumentFile>(observer => {
      const reader = new FileReader();

      reader.onload = () => {
        const docs = this.loadDocuments();
        const newDoc: DocumentFile = {
          id: Date.now(),
          name: file.name,
          type: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          folderId,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          content: reader.result as string,
          createdAt: new Date().toISOString()
        };

        docs.push(newDoc);
        this.saveDocuments(docs);
        observer.next(newDoc);
        observer.complete();
      };

      reader.onerror = () => {
        observer.error(reader.error);
      };

      reader.readAsDataURL(file);
    });
  }

  deleteDocument(docId: number): Observable<void> {
    const docs = this.loadDocuments().filter(doc => doc.id !== docId);
    this.saveDocuments(docs);

    return of(void 0);
  }

  downloadDocument(doc: DocumentFile): void {
    const storedDoc = this.loadDocuments().find(item => item.id === doc.id);
    if (!storedDoc?.content) {
      throw new Error('Arquivo nao encontrado para download.');
    }

    const link = document.createElement('a');
    link.href = storedDoc.content;
    link.download = storedDoc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  search(query: string): Observable<SearchResult> {
    const txt = query.toLowerCase().trim();
    if (!txt) return of({ folders: [], documents: [] });

    return this.getFolders().pipe(
      map(folders => ({
        folders: folders.filter(folder => folder.name.toLowerCase().includes(txt)),
        documents: this.loadDocuments().filter(doc => doc.name.toLowerCase().includes(txt))
      }))
    );
  }

  private mapFolder(folder: FolderResponseDTO): Folder {
    const fileCount = this.loadDocuments().filter(doc => doc.folderId === folder.id).length;

    return {
      id: folder.id,
      name: folder.nome,
      fileCount,
      parentId: null,
      createdAt: folder.dataCriacao
    };
  }

  private loadDocuments(): DocumentFile[] {
    const raw = localStorage.getItem(this.documentsStorageKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as DocumentFile[];
    } catch {
      return [];
    }
  }

  private saveDocuments(documents: DocumentFile[]): void {
    localStorage.setItem(this.documentsStorageKey, JSON.stringify(documents));
  }
}
