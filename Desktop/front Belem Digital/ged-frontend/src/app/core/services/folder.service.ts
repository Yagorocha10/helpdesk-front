import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';
import { Folder } from '../models/folder.model';
import { DocumentFile } from '../models/document-file.model';
import { environment } from 'src/environments/environment';

interface DocumentResponseDTO {
  id: number;
  nome: string;
  tipo: string;
  folderId: number;
  mimeType: string;
  tamanho: number;
  dataCriacao: string;
}

interface FolderResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string;
  parentId?: number | null;
  children?: FolderResponseDTO[];
  documents?: DocumentResponseDTO[];
  files?: DocumentResponseDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly apiUrl = `${environment.apiUrl}/folders`;

  constructor(private http: HttpClient) {}

  getFolders(parentId: number | null = null): Observable<Folder[]> {
    return this.http.get<FolderResponseDTO[]>(this.apiUrl, {
      params: parentId !== null ? { parentId } : {}
    }).pipe(
      map(folders => {
        const mappedFolders = folders.map(folder => this.mapFolder(folder));
        return this.filterFoldersByParent(mappedFolders, parentId);
      })
    );
  }

  getFolderById(id: number): Observable<Folder> {
    return this.http.get<FolderResponseDTO>(`${this.apiUrl}/${id}`).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    const payload: { nome: string; parentId?: number } = { nome: name.trim() };

    if (parentId !== null) {
      payload.parentId = parentId;
    }

    return this.http.post<FolderResponseDTO>(this.apiUrl, payload).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  renameFolder(folderId: number, name: string): Observable<Folder> {
    return this.http.patch<FolderResponseDTO>(`${this.apiUrl}/${folderId}`, { nome: name.trim() }).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  deleteFolder(folderId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${folderId}`);
  }

  searchFolders(query: string): Observable<Folder[]> {
    const txt = query.toLowerCase().trim();
    if (!txt) return of([]);

    return this.getFolders().pipe(
      map(folders => this.flattenFolders(folders).filter(folder => folder.name.toLowerCase().includes(txt)))
    );
  }

  private mapFolder(folder: FolderResponseDTO, parentIdFallback: number | null = null): Folder {
    const files = (folder.documents || folder.files || []).map(doc => this.mapDocument(doc));

    return {
      id: folder.id,
      name: folder.nome,
      fileCount: files.length,
      parentId: folder.parentId ?? parentIdFallback,
      children: (folder.children || []).map(child => this.mapFolder(child, folder.id)),
      files,
      createdAt: folder.dataCriacao
    };
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

  private filterFoldersByParent(folders: Folder[], parentId: number | null): Folder[] {
    const candidates = parentId === null ? folders : this.flattenFolders(folders);
    return candidates.filter(folder => (folder.parentId ?? null) === parentId);
  }

  private flattenFolders(folders: Folder[]): Folder[] {
    return folders.flatMap(folder => [folder, ...this.flattenFolders(folder.children || [])]);
  }
}
