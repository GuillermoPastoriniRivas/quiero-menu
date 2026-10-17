import mongoose, { type Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  importDirectoryInventory,
  InventoryBatchSchema,
} from './directory-inventory.js';
import { concepcionInventory } from './concepcion-inventory.js';

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

  it('loads the Concepción batch without replacing reviewed data, menus or hours', async () => {
    const rows = concepcionInventory();
    expect(rows.length).toBeGreaterThanOrEqual(50);
    const db = connection.db!;
    await importDirectoryInventory(db, [rows[0]], true);
    const stored = await db
      .collection('restaurants')
      .findOne({ slug: rows[0].slug });
    const reviewed = {
      phone: 'Teléfono revisado',
      bannerUrl: 'https://example.com/revisada.jpg',
      openOverride: 'closed',
      theme: { primaryColor: '#112233' },
    };
    await db
      .collection('restaurants')
      .updateOne({ _id: stored!._id }, { $set: reviewed });
    const menu = { restaurantId: stored!._id, name: 'Carta del equipo' };
    const hours = {
      restaurantId: stored!._id,
      dayOfWeek: 1,
      opensAt: '10:00',
      closesAt: '14:00',
    };
    await db.collection('menu_items').insertOne(menu);
    await db.collection('operating_hours').insertOne(hours);
    await importDirectoryInventory(db, rows, true);
    expect(
      await db.collection('restaurants').findOne({ slug: rows[0].slug }),
    ).toMatchObject(reviewed);
    expect(
      await db.collection('menu_items').findOne({ restaurantId: stored!._id }),
    ).toMatchObject(menu);
    expect(
      await db
        .collection('operating_hours')
        .findOne({ restaurantId: stored!._id }),
    ).toMatchObject(hours);
    expect(await db.collection('restaurants').countDocuments()).toBe(
      rows.length,
    );
    expect(
      (await importDirectoryInventory(db, rows, true)).every(
        (r) => r.action === 'unchanged',
      ),
    ).toBe(true);
  });

  it('protects legacy owner links, demo records and slug collisions in other cities', async () => {
    const db = connection.db!;
    await importDirectoryInventory(db, [row], true);
    const stored = await db
      .collection('restaurants')
      .findOne({ slug: row.slug });
    await db
      .collection('user_restaurants')
      .insertOne({ restaurantId: String(stored!._id) });
    expect(
      (
        await importDirectoryInventory(
          db,
          [{ ...row, description: 'No tocar' }],
          true,
        )
      )[0].action,
    ).toBe('protected');
    await db.collection('user_restaurants').deleteMany({});
    await db
      .collection('restaurants')
      .updateOne({ _id: stored!._id }, { $set: { isDemo: true } });
    expect((await importDirectoryInventory(db, [row], true))[0].action).toBe(
      'protected',
    );
    await db
      .collection('restaurants')
      .updateOne({ _id: stored!._id }, { $set: { isDemo: false } });
    expect(
      (
        await importDirectoryInventory(
          db,
          [{ ...row, city: 'Concepción del Uruguay' }],
          true,
        )
      )[0].action,
    ).toBe('protected');
  });

  it('fills missing images but never overwrites an existing gallery', async () => {
    const db = connection.db!;
    await importDirectoryInventory(db, [row], true);
    const photoGallery = [
      { url: 'https://example.com/foto.jpg', source: 'external' },
    ];
    await importDirectoryInventory(db, [{ ...row, photoGallery }], true);
    await importDirectoryInventory(
      db,
      [
        {
          ...row,
          photoGallery: [
            { url: 'https://example.com/otra.jpg', source: 'external' },
          ],
        },
      ],
      true,
    );
    expect(
      (await db.collection('restaurants').findOne({ slug: row.slug }))!
        .photoGallery,
    ).toEqual(photoGallery);
    expect(() =>
      InventoryBatchSchema.parse([{ ...row, logoUrl: 'javascript:alert(1)' }]),
    ).toThrow();
  });
});
