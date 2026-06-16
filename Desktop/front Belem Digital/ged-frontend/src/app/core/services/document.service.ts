import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Folder {
  id: number;
  name: string;
  fileCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private initialFolders: Folder[] = [
    { id: 1, name: 'Recursos Humanos', fileCount: 0},
    { id: 2, name: 'Finanças e Contratos', fileCount: 0},
    { id: 3, name: 'Tecnologia da Informação', fileCount: 0}
  ];

  private foldersSubject = new BehaviorSubject<Folder[]>(this.initialFolders);

  getFolders(): Observable<Folder[]> {
    return this.foldersSubject.asObservable();
  }

  addFolder(name: string): void {
    const currentFolders = this.foldersSubject.value;
    const newFolder: Folder = {
      id: Date.now(),
      name: name,
      fileCount: 0
    };
    this.foldersSubject.next([...currentFolders, newFolder]);
  }

  getFolderById(id: number): Folder | undefined {
    return this.foldersSubject.value.find(f => f.id === id);
  }
}