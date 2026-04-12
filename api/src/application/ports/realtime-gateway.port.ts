export interface RealtimeGatewayPort {
  emitToRestaurant(restaurantId: string, event: string, data: unknown): void;
}
