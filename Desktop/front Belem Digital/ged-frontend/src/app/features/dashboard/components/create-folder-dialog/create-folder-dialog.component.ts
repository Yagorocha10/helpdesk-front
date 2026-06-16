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
      name: ['', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.folderForm.valid) {
      this.dialogRef.close(this.folderForm.value.name);
    }
  }
}