import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MenuCategoryDocument = HydratedDocument<MenuCategoryModel>;

@Schema({ collection: 'menu_categories' })
export class MenuCategoryModel {
  @Prop({ type: Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isVisible: boolean;
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategoryModel);
MenuCategorySchema.index({ restaurantId: 1, displayOrder: 1 });
