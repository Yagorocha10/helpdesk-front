import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentFile } from '../../../../core/models/document-file.model';
import { Folder } from '../../../../core/models/folder.model';

interface DocumentTypeCount {
  name: string;
  count: number;
  percent: number;
}

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnChanges {
  @Input() folders: Folder[] = [];
  @Input() documents: DocumentFile[] = [];
  @Input() documentsError = false;
  @Input() foldersError = false;

  totalFolderCount = 0;
  documentTypeCounts: DocumentTypeCount[] = [];
  recentDocuments: DocumentFile[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.totalFolderCount = this.countFolders(this.folders);
    this.documentTypeCounts = this.buildDocumentTypeCounts(this.documents);
    this.recentDocuments = [...this.documents]
      .filter(doc => !!doc.createdAt && Number.isFinite(new Date(doc.createdAt).getTime()))
      .sort((a, b) => this.dateValue(b.createdAt) - this.dateValue(a.createdAt))
      .slice(0, 5);
  }

  documentTypeLabel(type: string): string {
    return type || 'Sem tipo informado';
  }

  private countFolders(folders: Folder[]): number {
    return folders.reduce((total, folder) => total + 1 + this.countFolders(folder.children || []), 0);
  }

  private buildDocumentTypeCounts(documents: DocumentFile[]): DocumentTypeCount[] {
    const counts = new Map<string, number>();
    documents.forEach(doc => {
      const type = doc.type?.trim() || 'Sem tipo informado';
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    const maxCount = Math.max(...counts.values(), 1);
    return Array.from(counts, ([name, count]) => ({
      name,
      count,
      percent: Math.max(Math.round(count / maxCount * 100), 6)
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
  }

  private dateValue(value?: string): number {
    const timestamp = value ? new Date(value).getTime() : 0;
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
}
