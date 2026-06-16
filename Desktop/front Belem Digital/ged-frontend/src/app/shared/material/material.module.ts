import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

const MATERIAL_MODULES = [
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatProgressBarModule
];

@NgModule({
  imports: [MATERIAL_MODULES],
  exports: [MATERIAL_MODULES]
})
export class MaterialModule { }