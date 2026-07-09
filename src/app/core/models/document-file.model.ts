export interface DocumentFile {
  id: number;
  name: string;
  type: string;
  folderId: number;
  mimeType?: string;
  size?: number;
  content?: string;
  createdAt?: string;
}
