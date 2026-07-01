const mongoose = require('mongoose');
const argon2 = require('argon2');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/bito_test');

  const db = mongoose.connection.db;
  const now = new Date();
  const tenants = db.collection('tenants');
  const users = db.collection('users');
  const products = db.collection('products');

  let tenant = await tenants.findOne({ slug: 'demo-store' });

  if (!tenant) {
    const tenantId = new mongoose.Types.ObjectId();

    await tenants.insertOne({
      _id: tenantId,
      name: 'Demo Store',
      slug: 'demo-store',
      createdAt: now,
      updatedAt: now,
    });

    tenant = { _id: tenantId };
  }

  const passwordHash = await argon2.hash('password123');

  await users.updateOne(
    { tenantId: tenant._id, email: 'admin@demo.com' },
    {
      $set: {
        tenantId: tenant._id,
        email: 'admin@demo.com',
        passwordHash,
        role: 'admin',
        name: 'Admin',
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  await users.updateOne(
    { tenantId: tenant._id, email: 'cashier@demo.com' },
    {
      $set: {
        tenantId: tenant._id,
        email: 'cashier@demo.com',
        passwordHash,
        role: 'cashier',
        name: 'Cashier',
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  const demoProducts = [
    { name: 'Coffee', sku: 'COF-001', price: 12000, costPrice: 7000, stock: 20 },
    { name: 'Tea', sku: 'TEA-001', price: 8000, costPrice: 3000, stock: 30 },
    { name: 'Cake', sku: 'CAK-001', price: 25000, costPrice: 14000, stock: 10 },
  ];

  for (const product of demoProducts) {
    await products.updateOne(
      { tenantId: tenant._id, sku: product.sku },
      {
        $set: {
          tenantId: tenant._id,
          ...product,
          isActive: true,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }

  console.log('Seeded demo-store');
  console.log('Admin: admin@demo.com / password123');
  console.log('Cashier: cashier@demo.com / password123');
  console.log('Products: Coffee, Tea, Cake');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
