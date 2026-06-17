import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Folder } from '../models/folder.model';

@Injectable({
  providedIn: 'root'
})
export class FolderService {

  // Banco de dados em memória focado apenas em pastas
  private mockFolders: Folder[] = [
    { id: 1, name: 'Contratos', fileCount: 0, parentId: null },
    { id: 2, name: 'Recursos Humanos', fileCount: 0, parentId: null },
    { id: 3, name: 'Financeiro', fileCount: 0, parentId: null },
    { id: 4, name: 'Projetos', fileCount: 0, parentId: null }
  ];

  constructor() {}

  // Listar pastas por nível (null traz a raiz da Dashboard)
  getFolders(parentId: number | null = null): Observable<Folder[]> {
    return of(this.mockFolders.filter(f => f.parentId === parentId));
  }

  // Buscar uma única pasta pelo ID
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

  // Atualizar o contador de arquivos da pasta (chamado quando o arquivo muda)
  updateFileCount(folderId: number, count: number): void {
    const folder = this.mockFolders.find(f => f.id === folderId);
    if (folder) {
      folder.fileCount = count;
    }
  }

  // Filtrar pastas para o mecanismo de busca global
  searchFolders(query: string): Observable<Folder[]> {
    const txt = query.toLowerCase().trim();
    if (!txt) return of([]);
    return of(this.mockFolders.filter(f => f.name.toLowerCase().includes(txt)));
  }
}