import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { FolderListComponent } from './components/folder-list/folder-list.component';
import { SharedModule } from '../../shared/shared.module';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { FolderDetailComponent } from './pages/folder-detail/folder-detail.component';
import { CreateFolderDialogComponent } from './components/create-folder-dialog/create-folder-dialog.component';
import { FolderTreeComponent } from './components/folder-tree/folder-tree.component';
import { StorageCardComponent } from './components/storage-card/storage-card.component';
import { DashboardLayoutComponent } from './components/dashboard-layout/dashboard-layout.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { FolderSelectionModalComponent } from './components/folder-selection-modal/folder-selection-modal.component';
import { TextInputDialogComponent } from './components/text-input-dialog/text-input-dialog.component';
import { UploadDropzoneComponent } from './components/upload-dropzone/upload-dropzone.component';
import { UploadProgressComponent } from './components/upload-progress/upload-progress.component';
import { FolderDropDirective } from './directives/folder-drop.directive';

@NgModule({
  declarations: [
    FolderListComponent,
    DashboardLayoutComponent,
    FolderTreeComponent,
    DashboardHomeComponent,
    FolderDetailComponent,
    CreateFolderDialogComponent,
    StorageCardComponent,
    FolderDropDirective,
    UploadDropzoneComponent,
    UploadProgressComponent,
    FolderSelectionModalComponent,
    TextInputDialogComponent,
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    ScrollingModule,
    SharedModule
  ],
  exports: [
    DashboardLayoutComponent,
    DashboardHomeComponent,
    FolderDetailComponent
  ]
})
export class DashboardModule { }
