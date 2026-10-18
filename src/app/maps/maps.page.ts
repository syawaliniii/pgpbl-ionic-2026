import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../data.service';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {

  map!: L.Map;

  private dataService = inject(DataService);

  constructor() { }

  ngOnInit() {

    if (!this.map) {

      setTimeout(() => {

        this.map = L.map('map').setView(
          [-7.7956, 110.3695],
          13
        );

        const osm = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors'
          }
        );

        const esri = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'ESRI'
          }
        );

        osm.addTo(this.map);

        const baseMaps = {
          'OpenStreetMap': osm,
          'Esri World Imagery': esri
        };

        L.control.layers(baseMaps).addTo(this.map);

        // Menampilkan point dari Firebase
        this.loadPoints();

      });

    }

  }

  async loadPoints() {

    try {

      const points: any = await this.dataService.getPoints();

      if (!points) {
        return;
      }

      for (const key in points) {

        if (points.hasOwnProperty(key)) {

          const point = points[key];

          const coordinates = point.coordinates
            .split(',')
            .map((c: string) => parseFloat(c));

          const marker = L.marker(
            coordinates as L.LatLngExpression
          ).addTo(this.map);

          marker.bindPopup(`
            <b>${point.name}</b><br>
            ${point.description || ''}
          `);

        }

      }

    } catch (error) {

      console.error(
        'Gagal mengambil data point dari Firebase:',
        error
      );

    }

  }

}
