import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { MenuItemType } from '../../../../domain/enums/menu-item-type.enum.js';
import type { SelectionMode } from '../../../../domain/entities/menu-item-option-group.entity.js';
import type { MenuItemComponent } from '../../../../domain/entities/menu-item-component.entity.js';

export type MenuItemDocument = HydratedDocument<MenuItemModel>;

@Schema({ collection: 'menu_items' })
export class MenuItemModel {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
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

  @Prop({
    type: [
      {
        _id: false,
        name: { type: String, required: true },
        groupId: { type: String },
        selectionMode: {
          type: String,
          enum: ['single', 'multiple', 'quantities'],
        },
        requiredTotal: { type: Number, default: null },
        optionPriceOverrides: {
          type: [
            {
              _id: false,
              sourceItemId: {
                type: MongooseSchema.Types.ObjectId,
                required: true,
              },
              priceDelta: { type: Number, required: true },
            },
          ],
          default: [],
        },
        minSelections: { type: Number, default: 0 },
        maxSelections: { type: Number, default: 0 },
        variantId: { type: MongooseSchema.Types.ObjectId, default: null },
        sourceCategoryId: {
          type: MongooseSchema.Types.ObjectId,
          default: null,
        },
        displayOrder: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  optionGroups: {
    name: string;
    groupId?: string;
    selectionMode?: SelectionMode;
    requiredTotal?: number | null;
    optionPriceOverrides?: {
      sourceItemId: Types.ObjectId;
      priceDelta: number;
    }[];
    minSelections: number;
    maxSelections: number;
    variantId: Types.ObjectId | null;
    sourceCategoryId: Types.ObjectId | null;
    displayOrder: number;
  }[];

  @Prop({
    type: [
      {
        _id: false,
        slotId: { type: String, required: true },
        name: { type: String, required: true },
        displayOrder: { type: Number, default: 0 },
        parentVariantId: { type: MongooseSchema.Types.ObjectId, default: null },
        quantity: { type: Number, required: true },
        choices: {
          type: [
            {
              _id: false,
              menuItemId: {
                type: MongooseSchema.Types.ObjectId,
                required: true,
              },
              variantId: { type: MongooseSchema.Types.ObjectId, default: null },
              priceDelta: { type: Number, default: 0 },
            },
          ],
          default: [],
        },
      },
    ],
    default: [],
  })
  components: (Omit<MenuItemComponent, 'parentVariantId' | 'choices'> & {
    parentVariantId: Types.ObjectId | null;
    choices: {
      menuItemId: Types.ObjectId;
      variantId: Types.ObjectId | null;
      priceDelta: number;
    }[];
  })[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItemModel);
MenuItemSchema.index({ restaurantId: 1, displayOrder: 1 });
MenuItemSchema.index({ categoryId: 1, displayOrder: 1 });
