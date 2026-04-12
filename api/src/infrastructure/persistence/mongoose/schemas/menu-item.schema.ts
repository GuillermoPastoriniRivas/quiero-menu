import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MenuItemType } from '../../../../domain/enums/menu-item-type.enum.js';

export type MenuItemDocument = HydratedDocument<MenuItemModel>;

@Schema({ collection: 'menu_items' })
export class MenuItemModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  basePrice: number;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ required: true, enum: MenuItemType, default: MenuItemType.SIMPLE })
  itemType: string;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItemModel);
MenuItemSchema.index({ restaurantId: 1, displayOrder: 1 });
MenuItemSchema.index({ categoryId: 1, displayOrder: 1 });
