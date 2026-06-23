import { DocumentFile } from './document-file.model';

export interface Folder {
  id: number;
  name: string;
  fileCount: number;
  parentId?: number | null;
  children?: Folder[];
  files?: DocumentFile[];
  createdAt?: string;
}
