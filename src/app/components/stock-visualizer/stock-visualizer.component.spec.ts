import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockVisualizerComponent } from './stock-visualizer.component';
import { StockDataService } from '../../services/stock-data.service';
import { of, Subject, Subscription } from 'rxjs';
import { IStockSummary } from '../../models/stock-summary.model';
import { CommonModule } from '@angular/common';

describe('StockVisualizerComponent', () => {
  let component: StockVisualizerComponent;
  let fixture: ComponentFixture<StockVisualizerComponent>;
  let mockStockService: jasmine.SpyObj<StockDataService>;

  const livePricesSubject = new Subject<any>();

  beforeEach(() => {
    mockStockService = jasmine.createSpyObj<StockDataService>(
      'StockDataService',
      [
        'subscribeToSymbol',
        'unsubscribeFromSymbol',
        'getStockSnapshot',
        'getLivePrices$',
        'disconnectSocket',
      ]
    );

    mockStockService.getLivePrices$.and.returnValue(
      livePricesSubject.asObservable()
    );
    mockStockService.getStockSnapshot.and.callFake((symbol: string) =>
      of({
        symbol,
        name: `${symbol} Inc.`,
        price: 100,
        dailyHigh: 120,
        dailyLow: 90,
        yearHigh: 150,
        yearLow: 80,
      } as IStockSummary)
    );

    TestBed.configureTestingModule({
      imports: [CommonModule, StockVisualizerComponent],
      providers: [{ provide: StockDataService, useValue: mockStockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(StockVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to all enabled stock symbols and get snapshots on init', () => {
    component.ngOnInit();

    component.stockSummaries.forEach((stock) => {
      expect(mockStockService.subscribeToSymbol).toHaveBeenCalledWith(
        stock.symbol
      );
      expect(mockStockService.getStockSnapshot).toHaveBeenCalledWith(
        stock.symbol
      );

      const matchedStock = component.stockSummaries.find(
        (s) => s.symbol === stock.symbol
      );
      expect(matchedStock?.price).toBe(100);
      expect(matchedStock?.dailyHigh).toBe(120);
    });
  });

  it('should update stock price from live data stream', () => {
    component.ngOnInit();

    livePricesSubject.next([
      { s: 'AAPL', p: 200 },
      { s: 'TSLA', p: 300 },
    ]);

    const aapl = component.stockSummaries.find((s) => s.symbol === 'AAPL');
    const tsla = component.stockSummaries.find((s) => s.symbol === 'TSLA');

    expect(aapl?.price).toBe(200);
    expect(tsla?.price).toBe(300);
  });

  it('should toggle subscription and call service methods accordingly', () => {
    const stock = component.stockSummaries[0];

    stock.enabled = true;
    component.toggleSubscription(stock);

    expect(stock.enabled).toBeFalse();
    expect(mockStockService.unsubscribeFromSymbol).toHaveBeenCalledWith(
      stock.symbol
    );

    component.toggleSubscription(stock);

    expect(stock.enabled).toBeTrue();
    expect(mockStockService.subscribeToSymbol).toHaveBeenCalledWith(
      stock.symbol
    );
  });

  it('should unsubscribe from all symbols and disconnect socket on destroy', () => {
    component.ngOnInit();

    const unsubscribeSpy = spyOn(Subscription.prototype, 'unsubscribe');

    component.ngOnDestroy();

    component.stockSummaries.forEach((stock) => {
      expect(mockStockService.unsubscribeFromSymbol).toHaveBeenCalledWith(
        stock.symbol
      );
    });

    expect(mockStockService.disconnectSocket).toHaveBeenCalled();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
