import {
  StoreClaim,
  StoreClaimStatus,
} from '../entities/store-claim.entity.js';

export interface CreateStoreClaimData {
  restaurantId: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}

export interface StoreClaimRepository {
  create(data: CreateStoreClaimData): Promise<StoreClaim>;
  findById(id: string): Promise<StoreClaim | null>;
  listByStatus(status: StoreClaimStatus, limit: number): Promise<StoreClaim[]>;
  findPendingByRestaurantId(restaurantId: string): Promise<StoreClaim[]>;
  updateStatus(
    id: string,
    status: StoreClaimStatus,
  ): Promise<StoreClaim | null>;
}
