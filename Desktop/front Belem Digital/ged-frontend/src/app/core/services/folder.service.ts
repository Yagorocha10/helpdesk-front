import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, throwError } from 'rxjs';
import { Folder } from '../models/folder.model';

interface FolderResponseDTO {
  id: number;
  nome: string;
  dataCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private readonly apiUrl = 'http://localhost:8080/folders';

  constructor(private http: HttpClient) {}

  getFolders(parentId: number | null = null): Observable<Folder[]> {
    if (parentId !== null) {
      return of([]);
    }

    return this.http.get<FolderResponseDTO[]>(this.apiUrl).pipe(
      map(folders => folders.map(folder => this.mapFolder(folder)))
    );
  }

  getFolderById(id: number): Observable<Folder> {
    return this.http.get<FolderResponseDTO>(`${this.apiUrl}/${id}`).pipe(
      map(folder => this.mapFolder(folder))
    );
  }

  addFolder(name: string, parentId: number | null = null): Observable<Folder> {
    if (parentId !== null) {
      return throwError(() => new Error('O backend ainda nao suporta subpastas.'));
    }

    return this.http.post<FolderResponseDTO>(this.apiUrl, { nome: name }).pipe(
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
      map(folders => folders.filter(folder => folder.name.toLowerCase().includes(txt)))
    );
  }

  private mapFolder(folder: FolderResponseDTO): Folder {
    return {
      id: folder.id,
      name: folder.nome,
      fileCount: 0,
      parentId: null,
      createdAt: folder.dataCriacao
    };
  }
}
