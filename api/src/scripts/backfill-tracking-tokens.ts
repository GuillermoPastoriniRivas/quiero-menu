import mongoose from 'mongoose';
import { generateTrackingToken } from '../application/common/generate-tracking-token.js';

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');

  await mongoose.connect(uri);
  const orders = mongoose.connection.collection('orders');
  const cursor = orders.find(
    { trackingToken: { $exists: false } },
    { projection: { _id: 1 } },
  );

  let updated = 0;
  for await (const order of cursor) {
    let token = generateTrackingToken();
    while ((await orders.countDocuments({ trackingToken: token })) > 0) {
      token = generateTrackingToken();
    }
    await orders.updateOne(
      { _id: order._id },
      { $set: { trackingToken: token } },
    );
    updated += 1;
  }

  console.log(
    `Backfill trackingToken completo: ${updated} pedidos actualizados`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
