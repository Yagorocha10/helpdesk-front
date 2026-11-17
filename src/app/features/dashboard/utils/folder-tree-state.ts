import { DocumentFile } from '../../../core/models/document-file.model';
import { Folder } from '../../../core/models/folder.model';

export type FolderTreeNode = FolderNode | FileNode;

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

export class FolderTreeState {
  static cloneFolders(folders: Folder[]): Folder[] {
    return folders.map(folder => ({
      ...folder,
      children: folder.children ? this.cloneFolders(folder.children) : undefined,
      files: folder.files ? [...folder.files] : undefined
    }));
  }

  static markPreloadedFolders(
    folders: Folder[],
    loadedFolderIds: Set<number>,
    leafFolderIds: Set<number>
  ): void {
    folders.forEach(folder => {
      if (folder.children || folder.files) {
        loadedFolderIds.add(folder.id);
      }

      if (
        (folder.children?.length || 0) === 0 &&
        (folder.files?.length || 0) === 0 &&
        (folder.children || folder.files)
      ) {
        leafFolderIds.add(folder.id);
      }

      this.markPreloadedFolders(folder.children || [], loadedFolderIds, leafFolderIds);
    });
  }

  static flattenVisibleFolders(folders: Folder[], expandedFolderIds: Set<number>, level = 0): FolderTreeNode[] {
    return folders.flatMap(folder => {
      const node: FolderNode = {
        type: 'folder',
        key: this.getFolderKey(folder.id),
        folder,
        level
      };

      if (!expandedFolderIds.has(folder.id)) {
        return [node];
      }

      const children = this.flattenVisibleFolders(folder.children || [], expandedFolderIds, level + 1);
      const files = (folder.files || []).map(file => ({
        type: 'file' as const,
        key: this.getFileKey(file.id),
        file,
        level: level + 1
      }));

      return [node, ...children, ...files];
    });
  }

  static findFolder(folderId: number, folders: Folder[]): Folder | undefined {
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

  static removeFolder(folderId: number, folders: Folder[]): boolean {
    const index = folders.findIndex(folder => folder.id === folderId);

    if (index >= 0) {
      folders.splice(index, 1);
      return true;
    }

    return folders.some(folder => this.removeFolder(folderId, folder.children || []));
  }

  static getFolderKey(folderId: number): string {
    return `folder-${folderId}`;
  }

  static getFileKey(fileId: number): string {
    return `file-${fileId}`;
  }

  static formatFolderName(name: string): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }
}
