import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchTermRepository } from '../../../../domain/repositories/search-term.repository.js';
import {
  SearchTermModel,
  SearchTermDocument,
} from '../schemas/search-term.schema.js';

@Injectable()
export class MongoSearchTermRepository implements SearchTermRepository {
  constructor(
    @InjectModel(SearchTermModel.name)
    private readonly model: Model<SearchTermDocument>,
  ) {}

  async record(term: string, hadResults: boolean): Promise<void> {
    await this.model.updateOne(
      { term },
      {
        $inc: hadResults ? { count: 1 } : { count: 1, zeroResults: 1 },
        $set: { lastAt: new Date() },
      },
      { upsert: true },
    );
  }

  async listTop(
    limit: number,
  ): Promise<
    { term: string; count: number; zeroResults: number; lastAt: Date }[]
  > {
    const rows = await this.model
      .find()
      .sort({ count: -1 })
      .limit(Math.min(Math.max(limit, 1), 200));
    return rows.map((r) => ({
      term: r.term,
      count: r.count,
      zeroResults: r.zeroResults,
      lastAt: r.lastAt,
    }));
  }
}
