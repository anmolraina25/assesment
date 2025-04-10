import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { tripLocation, tripNode } from './types';
import { TripService } from './services/trip.service';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'transport-simple';
  locationList: tripLocation[] = [];
  tripsForm = new FormGroup({
    trips: new FormArray<any>([]),
  });
  tripNodes: tripNode[] = [];
  private destroy$ = new Subject<boolean>();

  ngOnInit() {
    this.setUpTripsInputListener();
  }

  get tripsFormArray(): FormArray {
    return this.tripsForm.get('trips') as FormArray;
  }

  constructor(private tripService: TripService) {
    this.locationList = [...this.tripService.locationData];
  }

  private setUpTripsInputListener() {
    this.tripsFormArray.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((trips: any[]) => {
        let tripsToConsider: any[] = []
        trips.forEach((trip) => {
          if (trip.start && trip.end) {
            tripsToConsider.push(trip)
          }
        })
        this.tripNodes = [];
        if (tripsToConsider.length > 0) {
          this.calculateLevels(tripsToConsider);
        }
      });
  }

  private calculateLevels(trips: any[]) {
    // group nodes as per levels
    let levelledNodes: any[][] = [];
    for (let i = 0; i < trips.length; i++) {
      if (levelledNodes.length === 0) {
        levelledNodes.push([trips[i]])
      } else {
        let lastLevel = levelledNodes[levelledNodes.length - 1];
        if (lastLevel[0].start === trips[i].start && lastLevel[0].end === trips[i].end) {
          lastLevel.push(trips[i])
        } else {
          levelledNodes.push([trips[i]])
        }
      }
    }
    // calculate levels
    let level = 0;
    for (let j = 0; j < levelledNodes.length; j++) {
      // assign level to trip nodes
      for (let k = 0; k < levelledNodes[j].length; k++) {
        this.tripNodes.push({
          start: levelledNodes[j][k].start,
          end: levelledNodes[j][k].end,
          level: level,
          nextLink: ''
        })
      }
      // calculate level based on next node
      if (j !== levelledNodes.length - 1) {
        if (levelledNodes[j].length === 1 && levelledNodes[j + 1].length === 1) {
          // level unchanged
        }
        if (levelledNodes[j].length === 1 && levelledNodes[j + 1].length > 1) {
          level += 1;
        }
        if (levelledNodes[j].length > 1 && levelledNodes[j + 1].length > 1) {
          level += 1;
        }
        if (levelledNodes[j].length > 1 && levelledNodes[j + 1].length === 1) {
          level -= 1;
        }
      }
    }
    // now calculate link types between nodes
  }

  addTrip() {
    this.tripsFormArray.push(
      new FormGroup({
        start: new FormControl('', [Validators.required]),
        end: new FormControl('', [Validators.required]),
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
