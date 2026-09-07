import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SearchTermDocument = HydratedDocument<SearchTermModel>;

@Schema({ collection: 'search_terms' })
export class SearchTermModel {
  @Prop({ required: true, unique: true })
  term: string;

  @Prop({ default: 0 })
  count: number;

  @Prop({ default: 0 })
  zeroResults: number;

  @Prop({ default: () => new Date() })
  lastAt: Date;
}

export const SearchTermSchema = SchemaFactory.createForClass(SearchTermModel);
