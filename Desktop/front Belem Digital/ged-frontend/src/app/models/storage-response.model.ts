export interface StorageResponse {
  totalBytes: number;
  espacoUtilizado: string;
  quantidadeArquivos: number;

  totalFiles?: number;
  totalSizeBytes?: number;
}
