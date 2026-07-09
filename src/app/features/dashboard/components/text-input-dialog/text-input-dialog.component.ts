import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface TextInputDialogData {
  title: string;
  label: string;
  value?: string;
  confirmText?: string;
}

@Component({
  selector: 'app-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextInputDialogComponent {
  readonly form: FormGroup = this.fb.group({
    value: [this.data.value || '', [Validators.required, Validators.minLength(2)]]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TextInputDialogData,
    private dialogRef: MatDialogRef<TextInputDialogComponent, string | undefined>,
    private fb: FormBuilder
  ) {}

  confirm(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(this.form.value.value.trim());
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}
