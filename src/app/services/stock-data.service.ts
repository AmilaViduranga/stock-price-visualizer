import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IStockSummary } from '../models/stock-summary.model';

@Injectable({
  providedIn: 'root',
})
export class StockDataService {
  private socket$: WebSocketSubject<any>;
  private apiKey = environment.apiKey;
  private apiBase = environment.apiBase;
  private livePrices$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    /**
     * The Socket use to fetch real time stock price data
     */
    this.socket$ = webSocket({
      url: environment.socketBase.replace('{apiKey}', this.apiKey),
      deserializer: (msg) => JSON.parse(msg.data),
      serializer: (msg) => JSON.stringify(msg),
      openObserver: {
        next: () => console.log('[WebSocket] Connected'),
      },
      closeObserver: {
        next: () => console.log('[WebSocket] Disconnected'),
      },
    });

    this.socket$.subscribe((msg) => {
      if (msg.type === 'trade') {
        this.livePrices$.next(msg.data);
      }
    });
  }

  /**
   * Make the socket connection for provided symbol
   * @param symbol The stock symbol name eg: AAPL, MSFT
   */
  subscribeToSymbol(symbol: string): void {
    this.socket$.next({ type: 'subscribe', symbol });
  }

  /**
   * Terminate current listening socket connection
   * @param symbol The stock symbol name eg: AAPL, MSFT
   */
  unsubscribeFromSymbol(symbol: string): void {
    this.socket$.next({ type: 'unsubscribe', symbol });
  }

  /**
   * Share the latest data to the consuming component through the socket
   * @returns {Observable} Latest data that remote socket emit
   */
  getLivePrices$(): Observable<any> {
    return this.livePrices$.asObservable();
  }

  /**
   * Get the generic data like name, dailyHigh, dailyLow, year High, yearLow.
   * Need to call seperate URLS to fetch relevant data
   * @param symbol The stock symbol name eg: AAPL, MSFT
   * @returns Get combined output of stock generic details
   */
  getStockSnapshot(symbol: string): Observable<IStockSummary> {
    return forkJoin({
      quote: this.http.get<any>(
        `${this.apiBase}/quote?symbol=${symbol}&token=${this.apiKey}`
      ),
      profile: this.http.get<any>(
        `${this.apiBase}/stock/profile2?symbol=${symbol}&token=${this.apiKey}`
      ),
      metrics: this.http.get<any>(
        `${this.apiBase}/stock/metric?symbol=${symbol}&metric=all&token=${this.apiKey}`
      ),
    }).pipe(
      map((res) => ({
        symbol,
        price: undefined,
        enabled: true,
        name: res.profile.name,
        dailyHigh: res.quote.h,
        dailyLow: res.quote.l,
        yearHigh: res.metrics.metric['52WeekHigh'],
        yearLow: res.metrics.metric['52WeekLow'],
      }))
    );
  }

  /**
   * Terminate entire socket conenction
   */
  disconnectSocket() {
    this.socket$.complete();
  }
}
