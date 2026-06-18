import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardHomeComponent } from './features/dashboard/pages/dashboard-home/dashboard-home.component';
import { FolderDetailComponent } from './features/dashboard/pages/folder-detail/folder-detail.component';

const routes: Routes = [
  {
    path: 'dashboard/folder/:id',
    component: FolderDetailComponent
  },
  {
    path: 'dashboard',
    component: DashboardHomeComponent
  },
  {
    path: '',
    component: DashboardHomeComponent,
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
