import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

export class DashboardPage extends BasePage {
  protected readonly path = '/client/#/dashboard/dash';
  readonly productCards: Locator;
  readonly ordersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('.card-body');
    this.ordersButton = page.getByRole('button', { name: /ORDERS/ });
  }

  productCard(name: string): Locator {
    return this.productCards.filter({ hasText: name });
  }

  async addToCart(productName: string): Promise<void> {
    await this.productCard(productName).getByRole('button', { name: 'Add To Cart' }).click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.productCards.first()).toBeVisible();
  }
}
