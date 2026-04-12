import { DeliveryZone } from '../entities/delivery-zone.entity.js';

export interface DeliveryZoneRepository {
  create(data: Omit<DeliveryZone, 'id'>): Promise<DeliveryZone>;
  findByRestaurantId(restaurantId: string): Promise<DeliveryZone[]>;
  findById(id: string): Promise<DeliveryZone | null>;
  update(id: string, data: Partial<Omit<DeliveryZone, 'id' | 'restaurantId'>>): Promise<DeliveryZone | null>;
  delete(id: string): Promise<boolean>;
}
