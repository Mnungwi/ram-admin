import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'; 
import { NgxBootstrapMultiselectModule } from 'ngx-bootstrap-multiselect';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { MembershipComponent } from './membership.component';
import { MembershipData } from './membership.data';

export const routes: Routes = [
  { path: '', component: MembershipComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    InMemoryWebApiModule.forRoot(MembershipData, { delay: 0 }),
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgbModule, 
    NgxBootstrapMultiselectModule,
    NgxPaginationModule,
    PipesModule
  ],
  declarations: [
    MembershipComponent
  ]
})
export class MembershipModule { }
