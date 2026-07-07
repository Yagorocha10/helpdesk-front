import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { Folder } from '../models/folder.model';
import { DocumentFile } from '../models/document-file.model';
import { SearchResult } from '../models/search-result.model';
import { environment } from 'src/environments/environment';
import { StorageResponse } from 'src/app/models/storage-response.model';

interface FolderResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string;
  parentId?: number | null;
  children?: FolderResponseDTO[];
  documents?: DocumentResponseDTO[];
  files?: DocumentResponseDTO[];
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
  private readonly foldersUrl = `${environment.apiUrl}/folders`;
  private readonly documentsUrl = `${environment.apiUrl}/documents`;
  private readonly storageRefreshSubject = new Subject<void>();
  private readonly folderChangesSubject = new Subject<void>();
  private readonly folderCache = new Map<number, Folder>();
  readonly storageRefresh$ = this.storageRefreshSubject.asObservable();
  readonly folderChanges$ = this.folderChangesSubject.asObservable();

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

  getFolderBreadcrumb(folderId: number): Observable<Folder[]> {
    return this.getFolderForBreadcrumb(folderId).pipe(
      switchMap(folder => {
        if (!folder.parentId) {
          return of([folder]);
        }

        return this.getFolderBreadcrumb(folder.parentId).pipe(
          map(parentFolders => [...parentFolders, folder])
        );
      })
    );
  }

  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    const payload: { nome: string; parentId?: number } = { nome: name.trim() };

    if (parentId !== null) {
      payload.parentId = parentId;
    }

    return this.http.post<FolderResponseDTO>(this.foldersUrl, payload).pipe(
      map(folder => this.mapFolder(folder)),
      tap(() => this.notifyFoldersChanged())
    );
  }

  renameFolder(folderId: number, name: string): Observable<Folder> {
    return this.getFolderForBreadcrumb(folderId).pipe(
      switchMap(folder => this.http.patch<FolderResponseDTO>(`${this.foldersUrl}/${folderId}`, {
        nome: name.trim(),
        parentId: folder.parentId ?? null
      })),
      map(folder => this.mapFolder(folder)),
      tap(() => this.notifyFoldersChanged())
    );
  }

  moveFolder(folder: Folder, parentId: number | null): Observable<Folder> {
    return this.http.patch<FolderResponseDTO>(`${this.foldersUrl}/${folder.id}`, {
      nome: folder.name,
      parentId
    }).pipe(
      map(updatedFolder => this.mapFolder(updatedFolder)),
      tap(() => this.notifyFoldersChanged())
    );
  }

  deleteFolder(folderId: number): Observable<void> {
    return this.http.delete<void>(`${this.foldersUrl}/${folderId}`).pipe(
      tap(() => {
        this.folderCache.delete(folderId);
        this.notifyFoldersChanged();
        this.notifyStorageChanged();
      })
    );
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
      map(doc => this.mapDocument(doc)),
      tap(() => this.notifyStorageChanged())
    );
  }

  deleteDocument(docId: number): Observable<void> {
    return this.http.delete<void>(`${this.documentsUrl}/${docId}`).pipe(
      tap(() => this.notifyStorageChanged())
    );
  }

  getStorageInfo(): Observable<StorageResponse> {
    return this.http.get<StorageResponse>(environment.documentsStorageUrl);
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

  private getFolderForBreadcrumb(folderId: number): Observable<Folder> {
    const cachedFolder = this.folderCache.get(folderId);

    if (cachedFolder) {
      return of(cachedFolder);
    }

    return this.http.get<FolderResponseDTO>(`${this.foldersUrl}/${folderId}`).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  private getDocumentsByFolderRaw(folderId: number): Observable<DocumentResponseDTO[]> {
    return this.http.get<DocumentResponseDTO[]>(`${this.foldersUrl}/${folderId}/documents`);
  }

  private notifyStorageChanged(): void {
    this.storageRefreshSubject.next();
  }

  private notifyFoldersChanged(): void {
    this.folderChangesSubject.next();
  }

  private mapFolder(
    folder: FolderResponseDTO,
    documents: DocumentResponseDTO[] = [],
    parentIdFallback: number | null = null
  ): Folder {
    const fileCount = documents.filter(doc => String(doc.folderId) === String(folder.id)).length;
    const folderDocuments = folder.documents || folder.files || [];
    const children = folder.children?.map(child => this.mapFolder(child, documents, folder.id));
    const files = folderDocuments.map(doc => this.mapDocument(doc));

    const mappedFolder = {
      id: folder.id,
      name: folder.nome,
      fileCount: files.length || fileCount,
      parentId: folder.parentId ?? parentIdFallback,
      children,
      files,
      createdAt: folder.dataCriacao
    };

    this.folderCache.set(mappedFolder.id, mappedFolder);

    return mappedFolder;
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
