import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, switchMap } from 'rxjs';
import { Folder } from '../../../core/models/folder.model';
import { DocumentService } from '../../../core/services/document.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog.component';
import { TextInputDialogComponent } from '../components/text-input-dialog/text-input-dialog.component';

@Injectable({ providedIn: 'root' })
export class FolderTreeActionsService {
  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService
  ) {}

  createSubFolder(folder: Folder): Observable<Folder> {
    return this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Nova Subpasta',
        label: 'Nome da subpasta',
        confirmText: 'Criar'
      }
    }).afterClosed().pipe(
      filter((name): name is string => typeof name === 'string' && !!name.trim()),
      switchMap(name => this.documentService.addFolder(name, folder.id))
    );
  }

  renameFolder(folder: Folder): Observable<Folder> {
    return this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Renomear pasta',
        label: 'Novo nome da pasta',
        value: folder.name,
        confirmText: 'Salvar'
      }
    }).afterClosed().pipe(
      filter((name): name is string =>
        typeof name === 'string' && !!name.trim() && name.trim() !== folder.name
      ),
      switchMap(name => this.documentService.renameFolder(folder.id, name))
    );
  }

  deleteFolder(folder: Folder, displayName: string): Observable<void> {
    return this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Excluir pasta',
        message: `Excluir a pasta "${displayName}"?`,
        confirmText: 'Excluir'
      }
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(() => this.documentService.deleteFolder(folder.id))
    );
  }
}
