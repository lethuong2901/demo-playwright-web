/** Endpoints of the order feature, relative to API_BASE_URL (source: api-reference.md). */
export const EP = {
  createOrder: 'order/create-order',
  orderDetails: 'order/get-orders-details',
  ordersForCustomer: (customerId: string) => `order/get-orders-for-customer/${customerId}`,
  deleteOrder: (orderId: string) => `order/delete-order/${orderId}`,
} as const;
