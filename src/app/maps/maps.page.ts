import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  private router = inject(Router);

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

      }, 100);

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
            <div class="point-popup">
              <b class="point-popup-title">${point.name}</b>

              <div class="point-popup-description">
                ${point.description || ''}
              </div>

              <div class="point-popup-actions">
                <a href="#" class="popup-action edit-link" data-key="${key}">
                  <ion-icon name="create-outline"></ion-icon>
                  <span>Edit</span>
                </a>

                <a href="#" class="popup-action delete-link" data-key="${key}">
                  <ion-icon name="trash-outline"></ion-icon>
                  <span>Delete</span>
                </a>
              </div>
            </div>
          `);

        }

      }

      this.map.on('popupopen', (e) => {

        const popup = e.popup;
        const popupElement = popup.getElement();

        const deleteLink =
          popupElement?.querySelector('.delete-link');

        if (deleteLink) {

          deleteLink.addEventListener('click', async (event) => {

            event.preventDefault();

            const key = (event.currentTarget as HTMLElement)
              .dataset['key'];

            if (key) {

              const confirmed = window.confirm(
                'Apakah kamu yakin ingin menghapus point ini?'
              );

              if (!confirmed) {
                return;
              }

              try {

                await this.deletePoint(key, popup.getLatLng());

              } catch (error) {

                console.error(
                  'Gagal menghapus point dari Firebase:',
                  error
                );

                alert('Point gagal dihapus.');

              }

            }

          });

        }

        const editLink =
          popupElement?.querySelector('.edit-link');

        if (editLink) {

          editLink.addEventListener('click', (event) => {

            event.preventDefault();

            const key = (event.currentTarget as HTMLElement)
              .dataset['key'];

            if (key) {

              this.router.navigate(
                ['/tabs/editpoint'],
                {
                  state: { key: key }
                }
              );

            }

          });

        }

      });

    } catch (error) {

      console.error(
        'Gagal mengambil data point dari Firebase:',
        error
      );

    }

  }

  async deletePoint(
    key: string,
    latLng: L.LatLng | undefined
  ) {

    await this.dataService.deletePoint(key);

    if (latLng) {

      this.map.eachLayer((layer) => {

        if (layer instanceof L.Marker) {

          if (layer.getLatLng().equals(latLng)) {

            this.map.removeLayer(layer);

          }

        }

      });

    }

  }

}
