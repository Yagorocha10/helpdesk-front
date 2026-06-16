import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms'; 
import { RouterModule } from '@angular/router'; // IMPORTANTE: Adicionado para o Router funcionar

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { CreateFolderDialogComponent } from './components/create-folder-dialog/create-folder-dialog.component';
import { FolderDetailComponent } from './pages/folder-detail/folder-detail.component';

@NgModule({
  declarations: [
    DashboardHomeComponent,
    CreateFolderDialogComponent,
    FolderDetailComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ReactiveFormsModule,
    RouterModule, // IMPORTANTE: Declarado aqui
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class DashboardModule { }