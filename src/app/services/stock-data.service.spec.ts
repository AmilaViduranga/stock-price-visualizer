import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { StockDataService } from './stock-data.service';
import { Subject, BehaviorSubject } from 'rxjs';

describe('StockDataService', () => {
  let service: StockDataService;
  let httpMock: HttpTestingController;
  let mockSocket$: Subject<any>;
  let mockLivePrices$: BehaviorSubject<any[]>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StockDataService],
    });

    service = TestBed.inject(StockDataService);

    // Create mock WebSocket and live price subjects
    mockSocket$ = new Subject<any>();
    mockLivePrices$ = new BehaviorSubject<any[]>([]);

    // Override private socket$ and livePrices$ fields
    Object.defineProperty(service, 'socket$', {
      value: mockSocket$,
      writable: true,
    });

    Object.defineProperty(service, 'livePrices$', {
      value: mockLivePrices$,
      writable: true,
    });

    // Manually re-subscribe to simulate constructor logic
    mockSocket$.subscribe((msg) => {
      if (msg.type === 'trade') {
        mockLivePrices$.next(msg.data);
      }
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch stock snapshot for symbols', () => {
    const symbol = 'AAPL';

    service.getStockSnapshot(symbol).subscribe((data) => {
      expect(data.symbol).toBe(symbol);
      expect(data.name).toBe('Apple Inc');
      expect(data.dailyHigh).toBe(180);
      expect(data.dailyLow).toBe(170);
      expect(data.yearHigh).toBe(200);
      expect(data.yearLow).toBe(120);
    });

    const quoteReq = httpMock.expectOne((req) => req.url.includes('/quote'));
    expect(quoteReq.request.method).toBe('GET');
    quoteReq.flush({ h: 180, l: 170 });

    const profileReq = httpMock.expectOne((req) =>
      req.url.includes('/profile2')
    );
    expect(profileReq.request.method).toBe('GET');
    profileReq.flush({ name: 'Apple Inc' });

    const metricReq = httpMock.expectOne((req) => req.url.includes('/metric'));
    expect(metricReq.request.method).toBe('GET');
    metricReq.flush({ metric: { '52WeekHigh': 200, '52WeekLow': 120 } });
  });

  it('should subscribe and unsubscribe to symbols correctly', () => {
    const socketSpy = spyOn(mockSocket$, 'next');

    service.subscribeToSymbol('AAPL');
    expect(socketSpy).toHaveBeenCalledWith({
      type: 'subscribe',
      symbol: 'AAPL',
    });

    service.unsubscribeFromSymbol('AAPL');
    expect(socketSpy).toHaveBeenCalledWith({
      type: 'unsubscribe',
      symbol: 'AAPL',
    });
  });

  it('should close socket on disconnect', () => {
    const completeSpy = spyOn(mockSocket$, 'complete');
    service.disconnectSocket();
    expect(completeSpy).toHaveBeenCalled();
  });
});
