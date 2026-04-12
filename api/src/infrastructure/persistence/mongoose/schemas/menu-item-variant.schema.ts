import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuItemVariantDocument = HydratedDocument<MenuItemVariantModel>;

@Schema({ collection: 'menu_item_variants' })
export class MenuItemVariantModel {
  @Prop({ type: Types.ObjectId, required: true })
  itemId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: null })
  priceOverride: number | null;

  @Prop({ default: 1 })
  maxSelections: number;

  @Prop({ default: 0 })
  displayOrder: number;
}

export const MenuItemVariantSchema = SchemaFactory.createForClass(MenuItemVariantModel);
MenuItemVariantSchema.index({ itemId: 1 });
