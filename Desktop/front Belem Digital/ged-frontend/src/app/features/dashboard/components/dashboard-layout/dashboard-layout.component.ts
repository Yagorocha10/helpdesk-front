import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { Folder } from 'src/app/core/models/folder.model';
import { DocumentService } from 'src/app/core/services/document.service';
import { UploadService } from '../../services/upload.service';

interface BreadcrumbItem {
  label: string;
  commands: Array<string | number>;
}

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  folders: Folder[] = [];
  selectedFolderId: number | null = null;
  breadcrumbItems: BreadcrumbItem[] = this.getDefaultBreadcrumb();

  private readonly destroy$ = new Subject<void>();
  private breadcrumbRequestId = 0;

  constructor(
    private documentService: DocumentService,
    private router: Router,
    private uploadService: UploadService
  ) {}

  ngOnInit(): void {
    this.loadFolders();
    this.updateRouteState(this.router.url);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => this.updateRouteState(event.urlAfterRedirects));

    this.uploadService.completed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadFolders());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFolders(): void {
    this.documentService.getFolders(null)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: folders => this.folders = [...folders],
        error: error => console.error('Erro ao carregar pastas do layout:', error)
      });
  }

  onFolderTreeSelected(folder: Folder): void {
    this.selectedFolderId = folder.id;
    this.router.navigate(['/dashboard/folder', folder.id]);
  }

  private updateRouteState(url: string): void {
    const folderId = this.getFolderIdFromUrl(url);
    this.selectedFolderId = folderId;
    this.updateBreadcrumb(folderId);
  }

  private updateBreadcrumb(folderId: number | null): void {
    const requestId = ++this.breadcrumbRequestId;

    if (!folderId) {
      this.breadcrumbItems = this.getDefaultBreadcrumb();
      return;
    }

    this.documentService.getFolderBreadcrumb(folderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: folders => {
          if (requestId !== this.breadcrumbRequestId) {
            return;
          }

          this.breadcrumbItems = [
            { label: 'Dashboard', commands: ['/dashboard'] },
            ...folders.map(folder => ({
              label: this.formatFolderName(folder.name),
              commands: ['/dashboard/folder', folder.id]
            }))
          ];
        },
        error: error => {
          console.error('Erro ao carregar breadcrumb:', error);
          this.breadcrumbItems = this.getDefaultBreadcrumb();
        }
      });
  }

  private getFolderIdFromUrl(url: string): number | null {
    const cleanUrl = url.split('?')[0].split('#').pop() || url;
    const match = cleanUrl.match(/\/dashboard\/folder\/(\d+)/);

    return match ? Number(match[1]) : null;
  }

  private getDefaultBreadcrumb(): BreadcrumbItem[] {
    return [
      { label: 'Dashboard', commands: ['/dashboard'] },
      { label: 'Pastas de Documentos', commands: ['/dashboard'] }
    ];
  }

  private formatFolderName(name: Folder['name']): string {
    return name.trim().replace(/\S+/g, word =>
      word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1)
    );
  }
}
