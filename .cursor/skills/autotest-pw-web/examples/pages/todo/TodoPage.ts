import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/** TodoMVC (https://demo.playwright.dev/todomvc). Locator verify live trước khi viết. */
export class TodoPage extends BasePage {
  protected readonly path = '/todomvc';
  private readonly newTodo: Locator = this.page.getByPlaceholder('What needs to be done?');
  private readonly items: Locator = this.page.locator('.todo-list li');

  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.newTodo).toBeVisible();
  }

  async addTodo(text: string): Promise<void> {
    await this.newTodo.fill(text);
    await this.newTodo.press('Enter');
  }

  async expectCount(n: number): Promise<void> {
    await expect(this.items).toHaveCount(n);
  }

  async expectItemVisible(text: string): Promise<void> {
    await expect(this.items.filter({ hasText: text })).toBeVisible();
  }
}
