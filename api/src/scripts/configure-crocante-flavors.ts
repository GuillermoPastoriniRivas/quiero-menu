import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';

/** Explicit, reversible customer setup. Defaults to a read-only preview. */
async function main() {
  const apply = process.argv.includes('--apply');
  const backup = process.argv[process.argv.indexOf('--backup') + 1];
  if (apply && (!process.argv.includes('--backup') || !backup.startsWith('/')))
    throw new Error(
      '--apply requires an absolute --backup path inside the container',
    );
  await mongoose.connect(process.env.MONGODB_URI!);
  try {
    const db = mongoose.connection.db!;
    const restaurant = await db
      .collection('restaurants')
      .findOne({ slug: 'heladeria-crocante' });
    if (!restaurant) throw new Error('Crocante not found');
    const restaurantId = restaurant._id;
    const sourceId = new mongoose.Types.ObjectId('6abc543cb1fec8ba44658586');
    const targets = [
      { id: '6abc559db1fec8ba446585c2', max: 2 },
      { id: '6abc525ab1fec8ba44658508', max: 3 },
      { id: '6abbac2bb1fec8ba446576d3', max: 4 },
    ];
    const categories = await db
      .collection('menu_categories')
      .find({ restaurantId })
      .toArray();
    const items = await db
      .collection('menu_items')
      .find({ restaurantId })
      .toArray();
    if (!categories.some((c) => c._id.equals(sourceId)))
      throw new Error('Source category mismatch');
    const flavors = items.filter((i) => i.categoryId?.equals(sourceId));
    if (flavors.length !== 16)
      throw new Error(
        `Expected 16 source flavors, found ${flavors.length}. Review before applying.`,
      );
    for (const target of targets) {
      if (!items.some((i) => i._id.toHexString() === target.id))
        throw new Error('Target product mismatch');
    }
    const ids = targets.map((t) => new mongoose.Types.ObjectId(t.id));
    const options = await db
      .collection('menu_item_options')
      .find({ itemId: { $in: ids } })
      .toArray();
    if (options.some((o) => o.priceDelta !== 0 || o.optionGroup !== 'Clasicos'))
      throw new Error('Unexpected existing options: refusing to replace them');
    const preview = {
      slug: restaurant.slug,
      sourceFlavors: flavors.length,
      replacedOptions: options.length,
      potes: targets.map((t) => ({
        name: items.find((i) => i._id.toHexString() === t.id)!.name,
        min: 1,
        max: t.max,
      })),
      apply,
    };
    if (apply) {
      await writeFile(
        backup,
        mongoose.mongo.BSON.EJSON.stringify(
          { restaurantId, sourceId, categories, items, options },
          { relaxed: false },
        ),
        { flag: 'wx', mode: 0o600 },
      );
      await db
        .collection('menu_categories')
        .updateOne(
          { _id: sourceId, restaurantId },
          { $set: { isOptionSource: true } },
        );
      for (const target of targets) {
        await db.collection('menu_items').updateOne(
          { _id: new mongoose.Types.ObjectId(target.id), restaurantId },
          {
            $set: {
              optionGroups: [
                {
                  name: 'Sabores',
                  minSelections: 1,
                  maxSelections: target.max,
                  variantId: null,
                  displayOrder: 0,
                  sourceCategoryId: sourceId,
                },
              ],
            },
          },
        );
      }
      // Historical orders already contain the names and prices as snapshots.
      if (options.length)
        await db.collection('menu_item_options').deleteMany({
          _id: { $in: options.map((o) => o._id) },
          itemId: { $in: ids },
        });
    }
    console.log(JSON.stringify(preview));
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
