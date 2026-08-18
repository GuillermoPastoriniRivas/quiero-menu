export interface RealtimeGatewayPort {
  emitToRestaurant(restaurantId: string, event: string, data: unknown): void;
  emitToOrderRoom(restaurantId: string, code: string, event: string, data: unknown): void;
}
