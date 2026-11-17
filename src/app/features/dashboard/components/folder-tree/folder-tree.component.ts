import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, finalize, forkJoin, takeUntil } from 'rxjs';
import { Folder } from '../../../../core/models/folder.model';
import { DocumentService } from '../../../../core/services/document.service';
import { UploadService } from '../../services/upload.service';
import { FolderTreeActionsService } from '../../services/folder-tree-actions.service';
import { FolderTreeNode, FolderTreeState } from '../../utils/folder-tree-state';

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
    private documentService: DocumentService,
    private snackBar: MatSnackBar,
    private uploadService: UploadService,
    private folderTreeActions: FolderTreeActionsService
  ) {
    this.uploadService.completed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(folderId => this.refreshUploadedFolder(folderId));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['folders']) {
      this.rootFolders = FolderTreeState.cloneFolders(this.folders);
      FolderTreeState.markPreloadedFolders(this.rootFolders, this.loadedFolderIds, this.leafFolderIds);
      this.rebuildVisibleNodes();
    }

    if (changes['selectedFolderId'] && this.selectedFolderId) {
      this.activeNodeKey = FolderTreeState.getFolderKey(this.selectedFolderId);
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
    return node.type === 'folder' ? FolderTreeState.formatFolderName(node.folder.name) : node.file.name;
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

    this.runFolderAction(
      folder,
      this.folderTreeActions.createSubFolder(folder),
      createdFolder => {
        folder.children = [...(folder.children || []), createdFolder];
        this.loadedFolderIds.add(folder.id);
        this.leafFolderIds.delete(folder.id);
        this.expandedFolderIds.add(folder.id);
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      'Erro ao criar subpasta:',
      'Nao foi possivel criar a subpasta.'
    );
  }

  renameFolder(folder: Folder | undefined = this.contextFolder): void {
    if (!folder || this.actionFolderIds.has(folder.id)) {
      return;
    }

    this.runFolderAction(
      folder,
      this.folderTreeActions.renameFolder(folder),
      renamedFolder => {
        folder.name = renamedFolder.name;
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      'Erro ao renomear pasta:',
      'Nao foi possivel renomear a pasta.'
    );
  }

  deleteFolder(folder: Folder | undefined = this.contextFolder): void {
    if (!folder || this.actionFolderIds.has(folder.id)) {
      return;
    }

    this.runFolderAction(
      folder,
      this.folderTreeActions.deleteFolder(folder, this.formatFolderName(folder.name)),
      () => {
        FolderTreeState.removeFolder(folder.id, this.rootFolders);
        this.expandedFolderIds.delete(folder.id);
        this.loadedFolderIds.delete(folder.id);
        this.leafFolderIds.delete(folder.id);
        this.rebuildVisibleNodes();
        this.treeChanged.emit();
      },
      'Erro ao excluir pasta:',
      'Nao foi possivel excluir a pasta.'
    );
  }

  private runFolderAction<T>(
    folder: Folder,
    action: Observable<T>,
    onSuccess: (result: T) => void,
    errorContext: string,
    errorMessage: string
  ): void {
    this.actionFolderIds.add(folder.id);
    action.pipe(
      finalize(() => this.actionFolderIds.delete(folder.id)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: onSuccess,
      error: err => {
        console.error(errorContext, err);
        this.showError(errorMessage);
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
    this.activeNodeKey = FolderTreeState.getFolderKey(folder.id);

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
    const folder = FolderTreeState.findFolder(folderId, this.rootFolders);

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
    this.visibleNodes = FolderTreeState.flattenVisibleFolders(this.rootFolders, this.expandedFolderIds);

    if (!this.activeNodeKey && this.visibleNodes.length > 0) {
      this.activeNodeKey = this.visibleNodes[0].key;
    }
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

  private formatFolderName(name: string): string {
    return FolderTreeState.formatFolderName(name);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', { duration: 5000 });
  }
}
