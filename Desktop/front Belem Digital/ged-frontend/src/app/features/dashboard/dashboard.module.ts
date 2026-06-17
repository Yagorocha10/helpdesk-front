import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // FormsModule adicionado aqui
import { SharedModule } from '../../shared/shared.module';
import { DashboardRoutingModule } from './dashboard-routing.module';

// Componentes do Dashboard
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { FolderDetailComponent } from './pages/folder-detail/folder-detail.component';
import { CreateFolderDialogComponent } from './components/create-folder-dialog/create-folder-dialog.component';

// Módulos do Angular Material necessários
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FolderListComponent } from './components/folder-list/folder-list.component';

@NgModule({
  declarations: [
    DashboardHomeComponent,
    FolderDetailComponent,
    CreateFolderDialogComponent,
    FolderListComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // Adicionado aqui para liberar o [(ngModel)]
    SharedModule,
    DashboardRoutingModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class DashboardModule { }