import { UserRole } from '../enums/user-role.enum.js';

export class UserRestaurant {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly restaurantId: string,
    public readonly role: UserRole,
  ) {}
}
