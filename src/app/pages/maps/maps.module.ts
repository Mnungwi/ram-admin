import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router'; 
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsComponent } from './google-maps/google-maps.component';
import { LeafletMapsComponent } from './leaflet-maps/leaflet-maps.component';

export const routes: Routes = [
  { path: '', redirectTo: 'googlemaps', pathMatch: 'full'},
  { path: 'googlemaps', component: GoogleMapsComponent, data: { breadcrumb: 'Google Maps' } },
  { path: 'leafletmaps', component: LeafletMapsComponent, data: { breadcrumb: 'Leaflet Maps' } }
];

@NgModule({
  imports: [
    CommonModule,
    GoogleMapsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ 
    GoogleMapsComponent, 
    LeafletMapsComponent 
  ]
})
export class MapsModule { }
