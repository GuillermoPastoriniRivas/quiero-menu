import mongoose, { type Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  importDirectoryInventory,
  InventoryBatchSchema,
} from './directory-inventory.js';

jest.setTimeout(180_000);
const row = {
  slug: 'panaderia-prueba',
  name: 'Panadería Prueba',
  city: 'Resistencia',
  category: 'panaderia',
  sourceUrls: ['https://example.com/local'],
};

describe('Directory importer with isolated Mongo', () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose
      .createConnection(mongo.getUri(), { dbName: 'inventory_test' })
      .asPromise();
    await connection
      .db!.collection('restaurants')
      .createIndex({ slug: 1 }, { unique: true });
  });
  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });
  beforeEach(async () => {
    await connection.db!.dropDatabase();
  });

  it('validates the complete batch and defaults to a read-only preview', async () => {
    expect(() =>
      InventoryBatchSchema.parse([row, { ...row, slug: 'guias' }]),
    ).toThrow();
    expect(() =>
      InventoryBatchSchema.parse([{ ...row, city: 'Ciudad desconocida' }]),
    ).toThrow();
    await importDirectoryInventory(connection.db!, [row]);
    expect(
      await connection.db!.collection('restaurants').countDocuments(),
    ).toBe(0);
  });
  it('reimports without duplicating, touching menus or changing freshness', async () => {
    const db = connection.db!;
    await importDirectoryInventory(db, [row], true);
    const first = await db
      .collection('restaurants')
      .findOne({ slug: row.slug });
    await db
      .collection('menu_items')
      .insertOne({ restaurantId: first!._id, name: 'Pan' });
    const again = await importDirectoryInventory(db, [row], true);
    expect(again[0].action).toBe('unchanged');
    expect(await db.collection('restaurants').countDocuments()).toBe(1);
    expect(await db.collection('subscriptions').countDocuments()).toBe(1);
    expect(await db.collection('menu_items').countDocuments()).toBe(1);
    expect(
      (await db.collection('restaurants').findOne({ slug: row.slug }))!
        .updatedAt,
    ).toEqual(first!.updatedAt);
  });
  it('fills missing coordinates, preserves reviewed fields and refuses owner records', async () => {
    const db = connection.db!;
    await importDirectoryInventory(db, [row], true);
    await db
      .collection('restaurants')
      .updateOne({ slug: row.slug }, { $set: { phone: '3412345678' } });
    await importDirectoryInventory(
      db,
      [{ ...row, phone: 'otra', coordinates: { lat: -27.45, lng: -58.98 } }],
      true,
    );
    const stored = await db
      .collection('restaurants')
      .findOne({ slug: row.slug });
    expect(stored!.phone).toBe('3412345678');
    expect(stored!.coordinates).toEqual({ lat: -27.45, lng: -58.98 });
    await db
      .collection('user_restaurants')
      .insertOne({ restaurantId: stored!._id });
    expect(
      (
        await importDirectoryInventory(
          db,
          [{ ...row, description: 'No reemplazar' }],
          true,
        )
      )[0].action,
    ).toBe('protected');
    await db
      .collection('restaurants')
      .updateOne({ _id: stored!._id }, { $set: { claimed: true } });
    expect((await importDirectoryInventory(db, [row], true))[0].action).toBe(
      'protected',
    );
  });
  it('avoids duplicating the same business under a different slug', async () => {
    const db = connection.db!;
    await importDirectoryInventory(db, [row], true);
    expect(
      (
        await importDirectoryInventory(db, [{ ...row, slug: 'otra-url' }], true)
      )[0].action,
    ).toBe('duplicate');
    expect(await db.collection('restaurants').countDocuments()).toBe(1);
  });
});
