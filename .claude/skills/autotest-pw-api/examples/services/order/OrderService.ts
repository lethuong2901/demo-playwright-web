import { ApiClient } from '@services/base/ApiClient';
import { EP } from './order.endpoints';

export interface OrderLine {
  country: string;
  productOrderedId: string;
}

export interface CreateOrderResponse {
  orders: string[];
  productOrderId: string[];
  message: string;
}

export interface OrderDetailsResponse {
  data: { _id: string; country: string; productName: string };
  message: string;
}

/** API object of the order feature (course: APiUtils.createOrder, typed). */
export class OrderService {
  constructor(private readonly api: ApiClient) {}

  async create(lines: OrderLine[]): Promise<CreateOrderResponse> {
    const response = await this.api.post(EP.createOrder, { data: { orders: lines }, expectStatus: 201 });
    return ApiClient.json<CreateOrderResponse>(response);
  }

  async details(orderId: string): Promise<OrderDetailsResponse> {
    const response = await this.api.get(EP.orderDetails, { params: { id: orderId } });
    return ApiClient.json<OrderDetailsResponse>(response);
  }

  /** Teardown helper — remove data created by a test. */
  async remove(orderId: string): Promise<void> {
    await this.api.delete(EP.deleteOrder(orderId));
  }
}
