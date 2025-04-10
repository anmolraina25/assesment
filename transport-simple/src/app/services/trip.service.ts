import { Injectable } from '@angular/core';
import { tripLocation } from '../types';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  constructor() { }

  locationData: tripLocation[] = [
    { name: "Mumbai", code: "MUM" },
    { name: "Delhi", code: "DEL" },
    { name: "Bengaluru", code: "BLR" },
    { name: "Hyderabad", code: "HYD" },
    { name: "Chennai", code: "MAA" },
    { name: "Kolkata", code: "CCU" },
    { name: "Pune", code: "PNQ" },
    { name: "Ahmedabad", code: "AMD" },
    { name: "Jaipur", code: "JAI" },
    { name: "Lucknow", code: "LKO" }
  ]
}
