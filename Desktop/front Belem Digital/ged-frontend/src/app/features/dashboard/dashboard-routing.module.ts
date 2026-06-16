import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { FolderDetailComponent } from './pages/folder-detail/folder-detail.component';

const routes: Routes = [
  { path: '', component: DashboardHomeComponent },
  { path: 'folder/:id', component: FolderDetailComponent } // Rota relativa correta
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }