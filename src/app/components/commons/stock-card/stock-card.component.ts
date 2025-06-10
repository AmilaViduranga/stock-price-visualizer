import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IStockSummary } from '../../../models/stock-summary.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-card',
  imports: [CommonModule],
  templateUrl: './stock-card.component.html',
  styleUrl: './stock-card.component.scss',
})
export class StockCardComponent {
  @Input() stockSummary!: IStockSummary;

  @Output() toggleSubscriptionEmiter: EventEmitter<IStockSummary> =
    new EventEmitter<IStockSummary>();

  /**
   * Toggle event listner
   * When the frontend toggle button this method will trigger
   * @param stock The stock object that needed to toggle data listening
   */
  toggleSubscription(stock: IStockSummary): void {
    this.toggleSubscriptionEmiter.emit(stock);
  }
}
