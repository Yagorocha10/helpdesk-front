import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout.component';
import { SharedModule } from '../shared/shared.module'; // Linha adicionada
import { RouterModule } from '@angular/router'; // Necessário para o router-outlet funcionar

@NgModule({
  declarations: [
    LayoutComponent
  ],
  imports: [
    CommonModule,
    SharedModule, // Adicionado aqui
    RouterModule  // Adicionado aqui
  ],
  exports: [
    LayoutComponent
  ]
})
export class CoreModule { }