import { Folder } from './folder.model';
import { DocumentFile } from './document-file.model';

export interface SearchResult {
  folders: Folder[];
  documents: DocumentFile[];
}