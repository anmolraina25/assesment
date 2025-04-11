import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { tripLocation, tripNode } from '../../types';
import { TripService } from '../../services/trip.service';
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
import { max, Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'trip-planner',
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
  templateUrl: './trip-planner.component.html',
  styleUrl: './trip-planner.component.scss',
})
export class TripPlannerComponent {
  locationList: tripLocation[] = [];
  tripsForm = new FormGroup({
    trips: new FormArray<any>([]),
  });
  tripNodes: tripNode[] = [];
  private destroy$ = new Subject<boolean>();

  ngOnInit() {
    this.setUpTripsInputListener();
    this.tripsFormArray.push(
      new FormGroup({
        start: new FormControl('', [Validators.required]),
        end: new FormControl('', [Validators.required]),
      })
    );
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
        let tripsToConsider: any[] = [];
        trips.forEach((trip) => {
          if (trip.start && trip.end) {
            tripsToConsider.push(trip);
          }
        });
        this.tripNodes = [];
        if (tripsToConsider.length > 0) {
          this.calculateTripNodeList(tripsToConsider);
        }
      });
  }

  private calculateTripNodeList(trips: any[]) {
    // group nodes as per levels
    let levelledNodes: any[][] = [];
    for (let i = 0; i < trips.length; i++) {
      if (levelledNodes.length === 0) {
        levelledNodes.push([trips[i]]);
      } else {
        let lastLevel = levelledNodes[levelledNodes.length - 1];
        if (
          lastLevel[0].start === trips[i].start &&
          lastLevel[0].end === trips[i].end
        ) {
          lastLevel.push(trips[i]);
        } else {
          levelledNodes.push([trips[i]]);
        }
      }
    }
    // calculate levels
    let level = 0;
    let maxLevel = 0;
    for (let j = 0; j < levelledNodes.length; j++) {
      // assign level to trip nodes
      for (let k = 0; k < levelledNodes[j].length; k++) {
        this.tripNodes.push({
          start: levelledNodes[j][k].start,
          end: levelledNodes[j][k].end,
          level: level,
          nextLink: '',
        });
      }
      if (level > maxLevel) {
        maxLevel = level;
      }
      // calculate level based on next node
      if (j !== levelledNodes.length - 1) {
        if (
          levelledNodes[j].length === 1 &&
          levelledNodes[j + 1].length === 1
        ) {
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
    for (let m = 0; m < this.tripNodes.length; m++) {
      if (m < this.tripNodes.length - 1) {
        if (this.tripNodes[m].level === this.tripNodes[m + 1].level) {
          if (this.tripNodes[m].end === this.tripNodes[m + 1].start) {
            this.tripNodes[m].nextLink = 'CONTINUED';
          } else {
            this.tripNodes[m].nextLink = 'UNCONTINUED';
          }
        }
        if (this.tripNodes[m].level < this.tripNodes[m + 1].level) {
          if (this.tripNodes[m].end === this.tripNodes[m + 1].start) {
            this.tripNodes[m].nextLink = 'LEVEL_UP_CONT';
          } else {
            this.tripNodes[m].nextLink = 'LEVEL_UP_UNCONT';
          }
        }
        if (this.tripNodes[m].level > this.tripNodes[m + 1].level) {
          if (this.tripNodes[m].end === this.tripNodes[m + 1].start) {
            this.tripNodes[m].nextLink = 'LEVEL_DOWN_CONT';
          } else {
            this.tripNodes[m].nextLink = 'LEVEL_DOWN_UNCONT';
          }
        }
      } else {
        this.tripNodes[m].nextLink = '';
      }
    }
    setTimeout(() => {
      this.drawGraph(maxLevel + 1);
    });
  }

  private getGraphHolder(): HTMLDivElement {
    return document.getElementById('graph') as HTMLDivElement;
  }

  private drawGraph(maxLevel: number) {
    let canvas = document.getElementById('graphCanvas') as HTMLCanvasElement;
    canvas.height = Math.max(500, this.getGraphHolder().offsetHeight) - 6;
    canvas.width = Math.max(500, this.getGraphHolder().offsetWidth);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let heightStep = canvas.height / (maxLevel + 1);
    let widthStep = canvas.width / (this.tripNodes.length + 1);
    let nodeCordinates: { x: number; y: number }[] = [];
    // draw nodes
    let nodeRadius = 5;
    for (let i = 0; i < this.tripNodes.length; i++) {
      let x = widthStep * (i + 1);
      let y = heightStep * (maxLevel - this.tripNodes[i].level);
      nodeCordinates.push({ x: x, y: y });
      // create circle
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // draw edges
    for (let i = 0; i < nodeCordinates.length; i++) {
      // create label
      ctx.font = '10px Arial';
      ctx.fillText(
        this.tripNodes[i].start + '-' + this.tripNodes[i].end,
        nodeCordinates[i].x - nodeRadius * 4,
        nodeCordinates[i].y + nodeRadius * 4
      );
      if (i < nodeCordinates.length - 1) {
        if (this.tripNodes[i].nextLink === 'UNCONTINUED') {
          ctx.beginPath();
          this.drawLineWithArrow(
            ctx,
            nodeCordinates[i].x + nodeRadius,
            nodeCordinates[i].y,
            nodeCordinates[i + 1].x - nodeRadius,
            nodeCordinates[i + 1].y
          );
          ctx.stroke();
        }
        if (this.tripNodes[i].nextLink === 'CONTINUED') {
          ctx.beginPath();
          ctx.moveTo(nodeCordinates[i].x + nodeRadius, nodeCordinates[i].y);
          ctx.lineTo(
            nodeCordinates[i + 1].x - nodeRadius,
            nodeCordinates[i + 1].y
          );
          ctx.stroke();
        }
        if (
          this.tripNodes[i].nextLink === 'LEVEL_UP_UNCONT' ||
          this.tripNodes[i].nextLink === 'LEVEL_DOWN_UNCONT'
        ) {
          this.drawCurvedLineWithArrow(
            ctx,
            nodeCordinates[i].x + nodeRadius,
            nodeCordinates[i].y,
            nodeCordinates[i + 1].x - nodeRadius,
            nodeCordinates[i + 1].y
          );
        }
        if (
          this.tripNodes[i].nextLink === 'LEVEL_UP_CONT' ||
          this.tripNodes[i].nextLink === 'LEVEL_DOWN_CONT'
        ) {
          let from = { x: nodeCordinates[i].x + nodeRadius, y: nodeCordinates[i].y };
          let to = { x: nodeCordinates[i + 1].x - nodeRadius, y: nodeCordinates[i + 1].y}
          let mid = { x: from.x + ((to.x - from.x) / 2), y: to.y + ((from.y - to.y) / 2)}
          let bezierA = { x: from.x + ((to.x - from.x) / 2), y: from.y };
          let bezierB = { x: from.x + ((to.x - from.x) / 2), y: to.y };
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(bezierA.x,bezierA.y, mid.x, mid.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mid.x, mid.y);
          ctx.quadraticCurveTo(bezierB.x,bezierB.y,to.x, to.y);
          ctx.stroke();
        }
      }
    }
  }

  private drawLineWithArrow(
    context: CanvasRenderingContext2D,
    fromx: number,
    fromy: number,
    tox: number,
    toy: number
  ) {
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    context.moveTo(tox, toy);
    context.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
  }

  private drawCurvedLineWithArrow(
    ctx: CanvasRenderingContext2D,
    fromx: number,
    fromy: number,
    tox: number,
    toy: number
  ) {
    // DRAW CURVE
    let from = { x: fromx, y: fromy };
    let to = { x: tox, y: toy}
    let mid = { x: from.x + ((to.x - from.x) / 2), y: to.y + ((from.y - to.y) / 2)}
    let bezierA = { x: from.x + ((to.x - from.x) / 2), y: from.y };
    let bezierB = { x: from.x + ((to.x - from.x) / 2), y: to.y };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(bezierA.x,bezierA.y, mid.x, mid.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mid.x, mid.y);
    ctx.quadraticCurveTo(bezierB.x,bezierB.y,to.x, to.y);
    ctx.stroke();
    // DRAW ARROW
    ctx.beginPath();
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    // var angle = Math.atan2(dy, dx);
    var angle = 0;
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  }

  addTrip(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.tripsFormArray.push(
      new FormGroup({
        start: new FormControl('', [Validators.required]),
        end: new FormControl('', [Validators.required]),
      })
    );
  }

  clear(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.tripsFormArray.clear();
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
