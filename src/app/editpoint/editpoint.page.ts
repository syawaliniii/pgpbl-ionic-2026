import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { DataService } from '../data.service';

@Component({
  selector: 'app-editpoint',
  templateUrl: './editpoint.page.html',
  styleUrls: ['./editpoint.page.scss'],
  standalone: false,
})
export class EditpointPage implements OnInit {

  private router = inject(Router);
  private dataService = inject(DataService);

  map!: L.Map;
  marker!: L.Marker;

  key: string = '';
  name: string = '';
  coordinates: string = '';
  description: string = '';
  loading: boolean = true;

  constructor() { }

  ngOnInit() {
    this.key = history.state?.key || '';

    if (this.key) {
      this.loadPoint();
    } else {
      this.loading = false;
      console.error('Key point tidak ditemukan.');
    }
  }

  async loadPoint() {
    try {
      const point: any = await this.dataService.getPoint(this.key);

      if (point) {
        this.name = point.name || '';
        this.coordinates = point.coordinates || '';
        this.description = point.description || '';
      } else {
        console.error('Data point tidak ditemukan.');
      }
    } catch (error) {
      console.error('Gagal mengambil data point:', error);
    } finally {
      this.loading = false;
    }
  }

  // Membuat peta setelah halaman selesai ditampilkan
  ionViewDidEnter() {
    if (!this.loading && this.coordinates && !this.map) {
      setTimeout(() => {
        this.initializeMap();
      }, 150);
    }
  }

  initializeMap() {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const mapElement = document.getElementById('edit-map');

    if (!mapElement) {
      console.error('Elemen peta #edit-map belum tersedia.');
      return;
    }

    const coords = this.coordinates
      .split(',')
      .map((value: string) => Number(value.trim()));

    if (
      coords.length !== 2 ||
      !Number.isFinite(coords[0]) ||
      !Number.isFinite(coords[1]) ||
      Math.abs(coords[0]) > 90 ||
      Math.abs(coords[1]) > 180
    ) {
      console.error('Format koordinat tidak valid.');
      return;
    }

    this.map = L.map(mapElement).setView(
      [coords[0], coords[1]],
      17
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    this.marker = L.marker(
      [coords[0], coords[1]],
      { draggable: true }
    ).addTo(this.map);

    this.marker.bindPopup(
      'Geser marker untuk mengubah lokasi'
    );

    // Memperbarui koordinat saat marker digeser
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();

      this.coordinates =
        `${position.lat.toFixed(9)},${position.lng.toFixed(9)}`;
    });

    // Memindahkan marker dengan mengeklik peta
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.marker.setLatLng(event.latlng);

      this.coordinates =
        `${event.latlng.lat.toFixed(9)},${event.latlng.lng.toFixed(9)}`;
    });

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  async updatePoint() {
    if (!this.key) {
      alert('ID point tidak ditemukan. Buka Edit dari halaman Maps.');
      return;
    }

    if (!this.name.trim() || !this.coordinates.trim()) {
      alert('Nama dan koordinat point wajib diisi.');
      return;
    }

    const coords = this.coordinates
      .split(',')
      .map((value: string) => Number(value.trim()));

    if (
      coords.length !== 2 ||
      !Number.isFinite(coords[0]) ||
      !Number.isFinite(coords[1]) ||
      Math.abs(coords[0]) > 90 ||
      Math.abs(coords[1]) > 180
    ) {
      alert('Format koordinat tidak valid. Gunakan format latitude,longitude.');
      return;
    }

    try {
      await this.dataService.updatePoint(this.key, {
        name: this.name.trim(),
        coordinates: `${coords[0]},${coords[1]}`,
        description: this.description.trim()
      });

      alert('Point berhasil diperbarui.');

      if (this.map) {
        this.map.remove();
        this.map = undefined as any;
      }

      this.router.navigate(['/tabs/maps']);
    } catch (error) {
      console.error('Gagal memperbarui point:', error);
      alert('Point gagal diperbarui. Silakan coba lagi.');
    }
  }

  ionViewWillLeave() {
    if (this.map) {
      this.map.remove();
      this.map = undefined as any;
    }
  }

}
