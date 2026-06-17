import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-create-folder-dialog',
  templateUrl: './create-folder-dialog.component.html',
  styleUrls: ['./create-folder-dialog.component.scss']
  })
export class CreateFolderDialogComponent implements OnInit {
  folderForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateFolderDialogComponent>
  ) {}

  ngOnInit(): void {
    this.folderForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  onSubmit(): void {
    if (this.folderForm.valid) {
      // Envia o objeto com o nome de volta para quem abriu o dialog
      this.dialogRef.close(this.folderForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}