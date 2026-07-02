import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { StorageResponse } from 'src/app/models/storage-response.model';
import { DocumentService } from 'src/app/core/services/document.service';

@Component({
  selector: 'app-storage-card',
  templateUrl: './storage-card.component.html',
  styleUrls: ['./storage-card.component.scss']
})
export class StorageCardComponent implements OnInit, OnDestroy {
  storageInfo: StorageResponse = {
    totalBytes: 0,
    espacoUtilizado: '0 bytes',
    quantidadeArquivos: 0
  };
  formattedTotalFiles = '0';
  totalFilesLabel = 'arquivos';
  formattedTotalSize = '0 bytes';
  isLoading = false;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadStorageInfo();
    this.documentService.storageRefresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadStorageInfo());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStorageInfo(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.documentService.getStorageInfo().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: storageInfo => {
        const quantidadeArquivos = storageInfo.quantidadeArquivos ?? storageInfo.totalFiles ?? 0;
        const espacoUtilizado = storageInfo.espacoUtilizado ?? this.formatBytes(storageInfo.totalBytes ?? storageInfo.totalSizeBytes ?? 0);

        this.storageInfo = storageInfo;
        this.formattedTotalFiles = this.formatNumber(quantidadeArquivos);
        this.totalFilesLabel = quantidadeArquivos === 1 ? 'arquivo' : 'arquivos';
        this.formattedTotalSize = espacoUtilizado;
      },
      error: err => {
        console.error('Erro ao carregar informacoes de armazenamento:', err);
        this.errorMessage = 'Não foi possível carregar o armazenamento.';
      }
    });
  }

  formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '0 bytes';
    }

    const units = ['bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );
    const value = bytes / Math.pow(1024, unitIndex);

    if (unitIndex === 0) {
      const roundedBytes = Math.round(value);
      return `${roundedBytes} ${roundedBytes === 1 ? 'byte' : 'bytes'}`;
    }

    return `${this.formatDecimal(value)} ${units[unitIndex]}`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  }

  private formatDecimal(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: value >= 10 ? 0 : 1,
      maximumFractionDigits: value >= 10 ? 0 : 1
    }).format(value);
  }
}
