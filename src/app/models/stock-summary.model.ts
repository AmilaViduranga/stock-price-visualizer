export interface IStockSummary {
  symbol: string;
  name?: string;
  enabled: boolean;
  price?: number;
  dailyHigh?: number;
  dailyLow?: number;
  yearHigh?: number;
  yearLow?: number;
}
