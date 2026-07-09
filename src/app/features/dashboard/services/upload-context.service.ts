import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject, filter, map, takeUntil } from 'rxjs';

export interface UploadContext {
  folderId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class UploadContextService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly contextSubject = new BehaviorSubject<UploadContext>({ folderId: null });

  readonly context$ = this.contextSubject.asObservable();
  readonly currentFolderId$ = this.contextSubject.pipe(map(context => context.folderId));

  constructor(private router: Router) {
    this.setFromUrl(this.router.url);

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => this.setFromUrl(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get currentFolderId(): number | null {
    return this.contextSubject.value.folderId;
  }

  setCurrentFolder(folderId: number | null): void {
    this.contextSubject.next({ folderId });
  }

  private setFromUrl(url: string): void {
    const cleanUrl = url.split('?')[0].split('#').pop() || url;
    const match = cleanUrl.match(/\/dashboard\/folder\/(\d+)/);
    this.setCurrentFolder(match ? Number(match[1]) : null);
  }
}
