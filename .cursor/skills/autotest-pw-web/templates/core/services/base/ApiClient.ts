import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test';

type Query = Record<string, string | number | boolean>;

export interface RequestOptions {
  params?: Query;
  headers?: Record<string, string>;
  /** JSON body (object) — sent as application/json. */
  data?: unknown;
  /** multipart/form-data body (file upload). */
  multipart?: Record<string, string | number | boolean | { name: string; mimeType: string; buffer: Buffer }>;
  /**
   * Expected HTTP status; default: any 2xx. A number for negative cases (400, 401, 404...).
   * 'any' = no status check here — BDD style where a later Then step asserts the status.
   */
  expectStatus?: number | 'any';
}

/**
 * Thin wrapper over Playwright's APIRequestContext — every service class calls this,
 * never request.get/post directly. Adds: auth header, status assertion, step logging
 * (shows in the HTML report / trace), typed JSON parsing.
 */
export class ApiClient {
  private authHeader: Record<string, string> = {};

  constructor(private readonly request: APIRequestContext) {}

  /** Set the Authorization header for later calls (format follows api-reference.md). */
  setToken(token: string, scheme: 'Bearer' | 'raw' = 'Bearer'): void {
    this.authHeader = { Authorization: scheme === 'raw' ? token : `Bearer ${token}` };
  }

  clearToken(): void {
    this.authHeader = {};
  }

  get(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('GET', url, options);
  }

  post(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('POST', url, options);
  }

  put(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PUT', url, options);
  }

  patch(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('PATCH', url, options);
  }

  delete(url: string, options: RequestOptions = {}): Promise<APIResponse> {
    return this.send('DELETE', url, options);
  }

  /** Parse JSON body with a type. Fails with the raw body if it is not JSON. */
  static async json<T>(response: APIResponse): Promise<T> {
    const body = await response.text();
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new Error(`Response không phải JSON (${response.status()} ${response.url()}): ${body.slice(0, 500)}`);
    }
  }

  private async send(method: string, url: string, options: RequestOptions): Promise<APIResponse> {
    return test.step(`${method} ${url}`, async () => {
      const response = await this.request.fetch(url, {
        method,
        params: options.params,
        headers: { ...this.authHeader, ...options.headers },
        data: options.data,
        multipart: options.multipart,
      });
      if (options.expectStatus === 'any') {
        return response;
      }
      if (options.expectStatus !== undefined) {
        expect(response.status(), `${method} ${url} → ${await response.text()}`).toBe(options.expectStatus);
      } else {
        expect(response.ok(), `${method} ${url} → ${response.status()} ${await response.text()}`).toBeTruthy();
      }
      return response;
    });
  }
}
