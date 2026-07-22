import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-google-maps',
  templateUrl: './google-maps.component.html',
  styleUrls: ['./google-maps.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GoogleMapsComponent { 
  center: google.maps.LatLngLiteral = { lat: 45.421530, lng: -75.697193 };
  zoom = 7;
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  markerPositions: google.maps.LatLngLiteral[] = [
    { lat: 45.421530, lng: -75.697193 }
  ];
}
