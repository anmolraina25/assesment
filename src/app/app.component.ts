import { Component } from '@angular/core';
import { TripPlannerComponent } from './components/trip-planner/trip-planner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TripPlannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'transport-simple';
}
