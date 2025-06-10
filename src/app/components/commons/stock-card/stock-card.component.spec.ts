import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockCardComponent } from './stock-card.component';
import { IStockSummary } from '../../../models/stock-summary.model';

describe('StockCardComponent', () => {
  let component: StockCardComponent;
  let fixture: ComponentFixture<StockCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit toggleSubscriptionEmiter when toggleSubscription is called', () => {
    const testStock: IStockSummary = {
      symbol: 'AAPL',
      price: 150,
      dailyHigh: 155,
      dailyLow: 145,
      enabled: true,
    };

    spyOn(component.toggleSubscriptionEmiter, 'emit');

    component.toggleSubscription(testStock);

    expect(component.toggleSubscriptionEmiter.emit).toHaveBeenCalledWith(
      testStock
    );
  });
});
