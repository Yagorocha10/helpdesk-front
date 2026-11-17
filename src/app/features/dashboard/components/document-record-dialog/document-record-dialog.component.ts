import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export type DocumentRecordType = 'versions' | 'activities';

export interface DocumentRecordDialogData {
  type: DocumentRecordType;
  documentName: string;
}

@Component({
  selector: 'app-document-record-dialog',
  templateUrl: './document-record-dialog.component.html',
  styleUrls: ['./document-record-dialog.component.scss']
})
export class DocumentRecordDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DocumentRecordDialogData) {}

  get title(): string {
    return this.data.type === 'versions' ? 'Histórico de versões' : 'Atividades do arquivo';
  }

  get unavailableMessage(): string {
    return this.data.type === 'versions'
      ? 'A API atual não disponibiliza versões anteriores deste documento.'
      : 'A API atual não disponibiliza o registro de atividades deste documento.';
  }
}
