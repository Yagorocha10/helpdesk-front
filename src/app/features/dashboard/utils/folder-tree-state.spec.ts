import { Folder } from '../../../core/models/folder.model';
import { FolderTreeState } from './folder-tree-state';

describe('FolderTreeState', () => {
  const createFolders = (): Folder[] => [{
      id: 1,
      name: 'raiz',
      fileCount: 1,
      children: [{ id: 2, name: 'filha', fileCount: 0, children: [], files: [] }],
      files: [{ id: 10, name: 'arquivo.pdf', type: 'pdf', folderId: 1 }]
    }];

  it('clones the tree without sharing child arrays', () => {
    const folders = createFolders();
    const cloned = FolderTreeState.cloneFolders(folders);

    expect(cloned).not.toBe(folders);
    expect(cloned[0].children).not.toBe(folders[0].children);
    expect(cloned[0].children?.[0]).not.toBe(folders[0].children?.[0]);
    expect(cloned[0].files).not.toBe(folders[0].files);
  });

  it('flattens only expanded folders and marks their levels', () => {
    const folders = createFolders();
    const nodes = FolderTreeState.flattenVisibleFolders(folders, new Set([1]));

    expect(nodes.map(node => node.key)).toEqual(['folder-1', 'folder-2', 'file-10']);
    expect(nodes.map(node => node.level)).toEqual([0, 1, 1]);
  });

  it('finds and removes a nested folder', () => {
    const folders = createFolders();
    expect(FolderTreeState.findFolder(2, folders)?.name).toBe('filha');
    expect(FolderTreeState.removeFolder(2, folders)).toBeTrue();
    expect(folders[0].children).toEqual([]);
  });
});
