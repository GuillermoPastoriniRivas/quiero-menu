import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuItemOptionDocument = HydratedDocument<MenuItemOptionModel>;

@Schema({ collection: 'menu_item_options' })
export class MenuItemOptionModel {
  @Prop({ type: Types.ObjectId, required: true })
  itemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  variantId: Types.ObjectId | null;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 0 })
  priceDelta: number;

  @Prop({ required: true })
  optionGroup: string;

  @Prop({ default: true })
  isAvailable: boolean;
}

export const MenuItemOptionSchema = SchemaFactory.createForClass(MenuItemOptionModel);
MenuItemOptionSchema.index({ itemId: 1 });
MenuItemOptionSchema.index({ variantId: 1 });
