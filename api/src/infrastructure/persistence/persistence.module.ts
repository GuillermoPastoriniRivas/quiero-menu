import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantModel, RestaurantSchema } from './mongoose/schemas/restaurant.schema.js';
import { OperatingHoursModel, OperatingHoursSchema } from './mongoose/schemas/operating-hours.schema.js';
import { DeliveryZoneModel, DeliveryZoneSchema } from './mongoose/schemas/delivery-zone.schema.js';
import { MenuCategoryModel, MenuCategorySchema } from './mongoose/schemas/menu-category.schema.js';
import { MenuItemModel, MenuItemSchema } from './mongoose/schemas/menu-item.schema.js';
import { MenuItemVariantModel, MenuItemVariantSchema } from './mongoose/schemas/menu-item-variant.schema.js';
import { MenuItemOptionModel, MenuItemOptionSchema } from './mongoose/schemas/menu-item-option.schema.js';
import { OrderModel, OrderSchema } from './mongoose/schemas/order.schema.js';
import { OrderItemModel, OrderItemSchema } from './mongoose/schemas/order-item.schema.js';
import { OrderCounterModel, OrderCounterSchema } from './mongoose/schemas/order-counter.schema.js';
import { UserModel, UserSchema } from './mongoose/schemas/user.schema.js';
import { UserRestaurantModel, UserRestaurantSchema } from './mongoose/schemas/user-restaurant.schema.js';
import { RefreshTokenModel, RefreshTokenSchema } from './mongoose/schemas/refresh-token.schema.js';
import { KitchenAccessTokenModel, KitchenAccessTokenSchema } from './mongoose/schemas/kitchen-access-token.schema.js';

import { MongoRestaurantRepository } from './mongoose/repositories/mongo-restaurant.repository.js';
import { MongoOperatingHoursRepository } from './mongoose/repositories/mongo-operating-hours.repository.js';
import { MongoDeliveryZoneRepository } from './mongoose/repositories/mongo-delivery-zone.repository.js';
import { MongoMenuCategoryRepository } from './mongoose/repositories/mongo-menu-category.repository.js';
import { MongoMenuItemRepository } from './mongoose/repositories/mongo-menu-item.repository.js';
import { MongoMenuItemVariantRepository } from './mongoose/repositories/mongo-menu-item-variant.repository.js';
import { MongoMenuItemOptionRepository } from './mongoose/repositories/mongo-menu-item-option.repository.js';
import { MongoOrderRepository } from './mongoose/repositories/mongo-order.repository.js';
import { MongoOrderItemRepository } from './mongoose/repositories/mongo-order-item.repository.js';
import { MongoUserRepository } from './mongoose/repositories/mongo-user.repository.js';
import { MongoUserRestaurantRepository } from './mongoose/repositories/mongo-user-restaurant.repository.js';
import { MongoRefreshTokenRepository } from './mongoose/repositories/mongo-refresh-token.repository.js';
import { MongoKitchenAccessTokenRepository } from './mongoose/repositories/mongo-kitchen-access-token.repository.js';

const schemas = MongooseModule.forFeature([
  { name: RestaurantModel.name, schema: RestaurantSchema },
  { name: OperatingHoursModel.name, schema: OperatingHoursSchema },
  { name: DeliveryZoneModel.name, schema: DeliveryZoneSchema },
  { name: MenuCategoryModel.name, schema: MenuCategorySchema },
  { name: MenuItemModel.name, schema: MenuItemSchema },
  { name: MenuItemVariantModel.name, schema: MenuItemVariantSchema },
  { name: MenuItemOptionModel.name, schema: MenuItemOptionSchema },
  { name: OrderModel.name, schema: OrderSchema },
  { name: OrderItemModel.name, schema: OrderItemSchema },
  { name: OrderCounterModel.name, schema: OrderCounterSchema },
  { name: UserModel.name, schema: UserSchema },
  { name: UserRestaurantModel.name, schema: UserRestaurantSchema },
  { name: RefreshTokenModel.name, schema: RefreshTokenSchema },
  { name: KitchenAccessTokenModel.name, schema: KitchenAccessTokenSchema },
]);

const repositories = [
  { provide: 'RestaurantRepository', useClass: MongoRestaurantRepository },
  { provide: 'OperatingHoursRepository', useClass: MongoOperatingHoursRepository },
  { provide: 'DeliveryZoneRepository', useClass: MongoDeliveryZoneRepository },
  { provide: 'MenuCategoryRepository', useClass: MongoMenuCategoryRepository },
  { provide: 'MenuItemRepository', useClass: MongoMenuItemRepository },
  { provide: 'MenuItemVariantRepository', useClass: MongoMenuItemVariantRepository },
  { provide: 'MenuItemOptionRepository', useClass: MongoMenuItemOptionRepository },
  { provide: 'OrderRepository', useClass: MongoOrderRepository },
  { provide: 'OrderItemRepository', useClass: MongoOrderItemRepository },
  { provide: 'UserRepository', useClass: MongoUserRepository },
  { provide: 'UserRestaurantRepository', useClass: MongoUserRestaurantRepository },
  { provide: 'RefreshTokenRepository', useClass: MongoRefreshTokenRepository },
  { provide: 'KitchenAccessTokenRepository', useClass: MongoKitchenAccessTokenRepository },
];

@Module({
  imports: [schemas],
  providers: [...repositories],
  exports: [...repositories],
})
export class PersistenceModule {}
