export interface Folder {
  id: number;
  name: string;
  fileCount: number;
  parentId?: number | null;
  createdAt?: string;
}
