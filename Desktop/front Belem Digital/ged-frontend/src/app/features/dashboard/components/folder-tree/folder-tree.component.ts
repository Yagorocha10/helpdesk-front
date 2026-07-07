import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, filter, finalize, forkJoin, switchMap, takeUntil } from 'rxjs';
import { DocumentFile } from '../../../../core/models/document-file.model';
import { Folder } from '../../../../core/models/folder.model';
import { DocumentService } from '../../../../core/services/document.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { TextInputDialogComponent } from '../text-input-dialog/text-input-dialog.component';
import { UploadService } from '../../services/upload.service';

type FolderTreeNode = FolderNode | FileNode;

interface FolderNode {
  type: 'folder';
  key: string;
  folder: Folder;
  level: number;
}

interface FileNode {
  type: 'file';
  key: string;
  file: DocumentFile;
  level: number;
}

@Component({
  selector: 'app-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss']
})
export class FolderTreeComponent implements OnChanges, OnDestroy {
  @Input() folders: Folder[] = [];
  @Input() selectedFolderId?: number | null;

  @Output() folderSelected = new EventEmitter<Folder>();
  @Output() treeChanged = new EventEmitter<void>();

  @ViewChild('treeContainer') treeContainer?: ElementRef<HTMLElement>;
  @ViewChild('contextMenuTrigger') contextMenuTrigger?: MatMenuTrigger;

  rootFolders: Folder[] = [];
  visibleNodes: FolderTreeNode[] = [];
  expandedFolderIds = new Set<number>();
  loadingFolderIds = new Set<number>();
  loadedFolderIds = new Set<number>();
  leafFolderIds = new Set<number>();
  actionFolderIds = new Set<number>();

  activeNodeKey?: string;
  contextFolder?: Folder;
  isCollapsed = false;
  contextMenuX = 0;
  contextMenuY = 0;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private uploadService: UploadService
  ) {
    this.uploadService.completed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(folderId => this.refreshUploadedFolder(folderId));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folders']) {
      this.rootFolders = this.folders.map(folder => this.cloneFolder(folder));
      this.markPreloadedFolders(this.rootFolders);
      this.rebuildVisibleNodes();
    }

    if (changes['selectedFolderId'] && this.selectedFolderId) {
      this.activeNodeKey = this.getFolderKey(this.selectedFolderId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  canExpand(node: FolderTreeNode): boolean {
    return node.type === 'folder' && !this.leafFolderIds.has(node.folder.id);
  }

  isExpanded(node: FolderTreeNode): boolean {
    return node.type === 'folder' && this.expandedFolderIds.has(node.folder.id);
  }

  isLoading(node: FolderTreeNode): boolean {
    return node.type === 'folder' && this.loadingFolderIds.has(node.folder.id);
  }

  isSelected(node: FolderTreeNode): boolean {
    return node.type === 'folder' && this.selectedFolderId === node.folder.id;
  }

  isActive(node: FolderTreeNode): boolean {
    return this.activeNodeKey === node.key;
  }

  getNodeName(node: FolderTreeNode): string {
    return node.type === 'folder' ? this.formatFolderName(node.folder.name) : node.file.name;
  }

  getDropFolderId(node: FolderTreeNode): number | null {
    return node.type === 'folder' ? node.folder.id : null;
  }

  toggleFolder(event: Event, node: FolderTreeNode): void {
    event.preventDefault();
    event.stopPropagation();

    if (node.type !== 'folder' || !this.canExpand(node) || this.isLoading(node)) {
      return;
    }

    this.isExpanded(node) ? this.collapseFolder(node.folder) : this.expandFolder(node.folder);
  }

  selectNode(node: FolderTreeNode): void {
    this.activeNodeKey = node.key;

    if (node.type === 'folder') {
      this.folderSelected.emit(node.folder);
      return;
    }

    this.documentService.viewDocument(node.file);
  }

  openContextMenu(event: MouseEvent, node: FolderTreeNode): void {
    if (node.type !== 'folder') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.contextFolder = node.folder;
    
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    
    this.contextMenuTrigger?.openMenu();
  }

  createSubFolder(folder: Folder | undefined = this.contextFolder): void {
    if (!folder || this.actionFolderIds.has(folder.id)) {
      return;
    }

    this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Nova Subpasta',
        label: 'Nome da subpasta',
        confirmText: 'Criar'
      }
    }).afterClosed().pipe(
      filter((name): name is string => !!name?.trim()),
      switchMap(name => {
        this.actionFolderIds.add(folder.id);
        return this.documentService.addFolder(name, folder.id).pipe(
          finalize(() => this.actionFolderIds.delete(folder.id))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: createdFolder => {
        folder.children = [...(folder.children || []), createdFolder];
        this.loadedFolderIds.add(folder.id);
        this.leafFolderIds.delete(folder.id);
        this.expandedFolderIds.add(folder.id);
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      error: err => {
        console.error('Erro ao criar subpasta:', err);
        this.showError('Nao foi possivel criar a subpasta.');
      }
    });
  }

  renameFolder(folder: Folder | undefined = this.contextFolder): void {
    if (!folder || this.actionFolderIds.has(folder.id)) {
      return;
    }

    this.dialog.open(TextInputDialogComponent, {
      width: '420px',
      data: {
        title: 'Renomear pasta',
        label: 'Novo nome da pasta',
        value: folder.name,
        confirmText: 'Salvar'
      }
    }).afterClosed().pipe(
      filter((name): name is string => !!name?.trim() && name.trim() !== folder.name),
      switchMap(name => {
        this.actionFolderIds.add(folder.id);
        return this.documentService.renameFolder(folder.id, name).pipe(
          finalize(() => this.actionFolderIds.delete(folder.id))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: renamedFolder => {
        folder.name = renamedFolder.name;
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      error: err => {
        console.error('Erro ao renomear pasta:', err);
        this.showError('Nao foi possivel renomear a pasta.');
      }
    });
  }

  deleteFolder(folder: Folder | undefined = this.contextFolder): void {
    if (!folder || this.actionFolderIds.has(folder.id)) {
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Excluir pasta',
        message: `Excluir a pasta "${this.formatFolderName(folder.name)}"?`,
        confirmText: 'Excluir'
      }
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap(() => {
        this.actionFolderIds.add(folder.id);
        return this.documentService.deleteFolder(folder.id).pipe(
          finalize(() => this.actionFolderIds.delete(folder.id))
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.removeFolder(folder.id, this.rootFolders);
        this.expandedFolderIds.delete(folder.id);
        this.loadedFolderIds.delete(folder.id);
        this.leafFolderIds.delete(folder.id);
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      error: err => {
        console.error('Erro ao excluir pasta:', err);
        this.showError('Nao foi possivel excluir a pasta.');
      }
    });
  }

  onTreeKeydown(event: KeyboardEvent, node: FolderTreeNode): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusByOffset(node.key, 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusByOffset(node.key, -1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (node.type === 'folder' && !this.isExpanded(node)) {
          this.expandFolder(node.folder);
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (node.type === 'folder' && this.isExpanded(node)) {
          this.collapseFolder(node.folder);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectNode(node);
        break;
    }
  }

  trackByNodeKey(_index: number, node: FolderTreeNode): string {
    return node.key;
  }

  private expandFolder(folder: Folder): void {
    this.activeNodeKey = this.getFolderKey(folder.id);

    if (this.loadedFolderIds.has(folder.id)) {
      this.expandedFolderIds.add(folder.id);
      this.rebuildVisibleNodes();
      return;
    }

    this.loadingFolderIds.add(folder.id);
    forkJoin({
      children: this.documentService.getFolders(folder.id),
      files: this.documentService.getDocumentsByFolder(folder.id)
    }).pipe(
      finalize(() => this.loadingFolderIds.delete(folder.id))
    ).subscribe({
      next: ({ children, files }) => {
        folder.children = children;
        folder.files = files;
        folder.fileCount = files.length;
        this.loadedFolderIds.add(folder.id);

        if (children.length === 0 && files.length === 0) {
          this.leafFolderIds.add(folder.id);
        } else {
          this.expandedFolderIds.add(folder.id);
        }

        this.rebuildVisibleNodes();
      },
      error: err => {
        console.error('Erro ao carregar conteudo da pasta:', err);
        this.showError('Nao foi possivel carregar subpastas e arquivos.');
      }
    });
  }

  private collapseFolder(folder: Folder): void {
    this.expandedFolderIds.delete(folder.id);
    this.rebuildVisibleNodes();
  }

  private refreshUploadedFolder(folderId: number): void {
    const folder = this.findFolder(folderId, this.rootFolders);

    if (!folder || !this.loadedFolderIds.has(folderId)) {
      this.treeChanged.emit();
      return;
    }

    forkJoin({
      children: this.documentService.getFolders(folder.id),
      files: this.documentService.getDocumentsByFolder(folder.id)
    }).subscribe({
      next: ({ children, files }) => {
        folder.children = children;
        folder.files = files;
        folder.fileCount = files.length;
        this.leafFolderIds.delete(folder.id);
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      error: () => this.treeChanged.emit()
    });
  }

  private rebuildVisibleNodes(): void {
    this.visibleNodes = this.flattenVisibleFolders(this.rootFolders, 0);

    if (!this.activeNodeKey && this.visibleNodes.length > 0) {
      this.activeNodeKey = this.visibleNodes[0].key;
    }
  }

  private flattenVisibleFolders(folders: Folder[], level: number): FolderTreeNode[] {
    return folders.flatMap(folder => {
      const node: FolderNode = {
        type: 'folder',
        key: this.getFolderKey(folder.id),
        folder,
        level
      };

      if (!this.expandedFolderIds.has(folder.id)) {
        return [node];
      }

      const children = this.flattenVisibleFolders(folder.children || [], level + 1);
      const files = (folder.files || []).map(file => ({
        type: 'file' as const,
        key: this.getFileKey(file.id),
        file,
        level: level + 1
      }));

      return [node, ...children, ...files];
    });
  }

  private focusByOffset(currentNodeKey: string, offset: number): void {
    const currentIndex = this.visibleNodes.findIndex(node => node.key === currentNodeKey);
    const nextNode = this.visibleNodes[currentIndex + offset];

    if (!nextNode) {
      return;
    }

    this.activeNodeKey = nextNode.key;
    window.setTimeout(() => {
      this.treeContainer?.nativeElement
        .querySelector<HTMLElement>(`[data-node-key="${nextNode.key}"]`)
        ?.focus();
    });
  }

  private findFolder(folderId: number, folders: Folder[]): Folder | undefined {
    for (const folder of folders) {
      if (folder.id === folderId) {
        return folder;
      }

      const child = this.findFolder(folderId, folder.children || []);
      if (child) {
        return child;
      }
    }

    return undefined;
  }

  private removeFolder(folderId: number, folders: Folder[]): boolean {
    const index = folders.findIndex(folder => folder.id === folderId);

    if (index >= 0) {
      folders.splice(index, 1);
      return true;
    }

    return folders.some(folder => this.removeFolder(folderId, folder.children || []));
  }

  private cloneFolder(folder: Folder): Folder {
    return {
      ...folder,
      children: folder.children?.map(child => this.cloneFolder(child)),
      files: folder.files ? [...folder.files] : undefined
    };
  }

  private markPreloadedFolders(folders: Folder[]): void {
    folders.forEach(folder => {
      if (folder.children || folder.files) {
        this.loadedFolderIds.add(folder.id);
      }

      if ((folder.children?.length || 0) === 0 && (folder.files?.length || 0) === 0 && (folder.children || folder.files)) {
        this.leafFolderIds.add(folder.id);
      }

      this.markPreloadedFolders(folder.children || []);
    });
  }

  private getFolderKey(folderId: number): string {
    return `folder-${folderId}`;
  }

  private getFileKey(fileId: number): string {
    return `file-${fileId}`;
  }

  private formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }
}
