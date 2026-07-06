import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Folder } from 'src/app/core/models/folder.model';
import { DocumentService } from 'src/app/core/services/document.service';

interface FolderPickerNode {
  folder: Folder;
  level: number;
}

@Component({
  selector: 'app-folder-selection-modal',
  templateUrl: './folder-selection-modal.component.html',
  styleUrls: ['./folder-selection-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FolderSelectionModalComponent implements OnInit {
  folders: Folder[] = [];
  visibleNodes: FolderPickerNode[] = [];
  expandedFolderIds = new Set<number>();
  loadingFolderIds = new Set<number>();
  selectedFolderId: number | null = null;
  searchQuery = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private dialogRef: MatDialogRef<FolderSelectionModalComponent, number | null | undefined>,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadRootFolders();
  }

  selectFolder(folder: Folder): void {
    this.selectedFolderId = folder.id;
  }

  confirmSelection(): void {
    if (this.selectedFolderId !== null) {
      this.dialogRef.close(this.selectedFolderId);
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  onSearchChange(): void {
    this.rebuildVisibleNodes();
  }

  toggleFolder(event: Event, folder: Folder): void {
    event.stopPropagation();

    if (this.expandedFolderIds.has(folder.id)) {
      this.expandedFolderIds.delete(folder.id);
      this.rebuildVisibleNodes();
      return;
    }

    if (folder.children) {
      this.expandedFolderIds.add(folder.id);
      this.rebuildVisibleNodes();
      return;
    }

    this.loadingFolderIds.add(folder.id);
    this.documentService.getFolders(folder.id).pipe(
      finalize(() => {
        this.loadingFolderIds.delete(folder.id);
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: children => {
        folder.children = children;
        this.expandedFolderIds.add(folder.id);
        this.rebuildVisibleNodes();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar subpastas.';
      }
    });
  }

  isExpanded(folder: Folder): boolean {
    return this.expandedFolderIds.has(folder.id);
  }

  isLoadingFolder(folder: Folder): boolean {
    return this.loadingFolderIds.has(folder.id);
  }

  trackByFolderId(_index: number, node: FolderPickerNode): number {
    return node.folder.id;
  }

  formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }

  private loadRootFolders(): void {
    this.isLoading = true;
    this.documentService.getFolders(null).pipe(
      finalize(() => {
        this.isLoading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: folders => {
        this.folders = folders;
        this.rebuildVisibleNodes();
      },
      error: () => {
        this.errorMessage = 'Nao foi possivel carregar pastas.';
      }
    });
  }

  private rebuildVisibleNodes(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.visibleNodes = query
      ? this.flattenAll(this.folders, 0).filter(node => node.folder.name.toLowerCase().includes(query))
      : this.flattenExpanded(this.folders, 0);

    this.changeDetectorRef.markForCheck();
  }

  private flattenExpanded(folders: Folder[], level: number): FolderPickerNode[] {
    return folders.flatMap(folder => {
      const current = [{ folder, level }];

      if (!this.expandedFolderIds.has(folder.id)) {
        return current;
      }

      return [...current, ...this.flattenExpanded(folder.children || [], level + 1)];
    });
  }

  private flattenAll(folders: Folder[], level: number): FolderPickerNode[] {
    return folders.flatMap(folder => [
      { folder, level },
      ...this.flattenAll(folder.children || [], level + 1)
    ]);
  }
}
