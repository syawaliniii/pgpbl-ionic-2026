
import { Injectable } from '@angular/core';
import { ref, push, onValue, remove, get, update } from 'firebase/database';
import { database } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Save a new point
  savePoint(point: {
    name: string,
    coordinates: string,
    description: string
  }) {

    const pointsRef = ref(database, 'points');

    return push(pointsRef, point);
  }

  // Get all points from Firebase
  getPoints() {

    const pointsRef = ref(database, 'points');

    return new Promise((resolve, reject) => {

      onValue(
        pointsRef,
        (snapshot) => {
          const data = snapshot.val();
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );

    });
  }

  // Delete a point from Firebase
  deletePoint(key: string) {
    const pointRef = ref(database, `points/${key}`);
    return remove(pointRef);
  }

  // Get one point from Firebase
  getPoint(key: string) {
    const pointRef = ref(database, `points/${key}`);

    return new Promise((resolve, reject) => {
      get(pointRef)
        .then((snapshot) => {
          const data = snapshot.val();
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  // Update a point in Firebase
  updatePoint(
    key: string,
    point: {
      name: string,
      coordinates: string,
      description?: string
    }
  ) {
    const pointRef = ref(database, `points/${key}`);
    return update(pointRef, point);
  }

}
