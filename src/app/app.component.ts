import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockVisualizerComponent } from './components/stock-visualizer/stock-visualizer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StockVisualizerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'stock-price-assignment';
}
