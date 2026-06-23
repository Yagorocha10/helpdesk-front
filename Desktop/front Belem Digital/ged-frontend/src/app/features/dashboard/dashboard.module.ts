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

@NgModule({
  declarations: [
    FolderListComponent,
    FolderTreeComponent,
    DashboardHomeComponent,
    FolderDetailComponent,
    CreateFolderDialogComponent
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
    DashboardHomeComponent,
    FolderDetailComponent
  ]
})
export class DashboardModule { }
