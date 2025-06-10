import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { StockDataService } from '../../services/stock-data.service';
import { IStockSummary } from '../../models/stock-summary.model';
import { StockCardComponent } from '../commons/stock-card/stock-card.component';

@Component({
  selector: 'app-stock-visualizer',
  imports: [CommonModule, StockCardComponent],
  templateUrl: './stock-visualizer.component.html',
  styleUrls: ['./stock-visualizer.component.scss'],
})
export class StockVisualizerComponent implements OnInit, OnDestroy {
  stockSummaries: IStockSummary[] = [
    {
      symbol: 'AAPL',
      name: 'Apple',
      enabled: true,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft',
      enabled: true,
    },
    {
      symbol: 'GOOGL',
      name: 'Google',
      enabled: true,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla',
      enabled: true,
    },
  ];

  private subscriptions: Subscription[] = [];

  constructor(private stockService: StockDataService) {}

  ngOnInit(): void {
    /**
     * create the socket connection that needed to have and get the stock general details.
     */
    this.stockSummaries.forEach((stockSummary) => {
      if (stockSummary.enabled) {
        this.stockService.subscribeToSymbol(stockSummary.symbol);
      }

      const generalDetails = this.stockService
        .getStockSnapshot(stockSummary.symbol)
        .subscribe((snapshot) => {
          Object.assign(stockSummary, snapshot);
        });

      const stockPrice = this.stockService
        .getLivePrices$()
        .subscribe((trades) => {
          trades.forEach((trade: { s: string; p?: number }) => {
            const match = this.stockSummaries.find(
              (stock) => stock.symbol === trade.s && stock.enabled
            );
            if (match) {
              match.price = trade.p;
            }
          });
        });

      this.subscriptions.push(generalDetails, stockPrice);
    });
  }

  /**
   * The handler function of the toggle button
   * @param stock the StockSummary object that trihgger toggle
   */
  toggleSubscription(stock: IStockSummary): void {
    stock.enabled = !stock.enabled;
    if (stock.enabled) {
      this.stockService.subscribeToSymbol(stock.symbol);
    } else {
      this.stockService.unsubscribeFromSymbol(stock.symbol);
    }
  }

  /**
   * Handle all the unsubscriptions that is needed to handle
   * Teminate socket connection
   * Unsubscribe the Subscription Array
   */
  ngOnDestroy(): void {
    this.stockSummaries.forEach((stockSummary) =>
      this.stockService.unsubscribeFromSymbol(stockSummary.symbol)
    );
    this.stockService.disconnectSocket();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
