import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { MailboxComponent } from './mailbox.component';

export const routes: Routes = [
  { path: '', component: MailboxComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    NgScrollbarModule,
    PipesModule
  ],
  declarations: [
    MailboxComponent
  ]
})
export class MailboxModule { }
