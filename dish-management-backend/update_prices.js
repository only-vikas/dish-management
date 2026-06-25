const { MongoClient } = require('mongodb');

require('dotenv').config();

async function main() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    // Using the default db from URI
    const db = client.db();
    const collection = db.collection('dishes');

    const prices = {
      'Margherita Pizza': 14.99,
      'Caesar Salad': 12.00,
      'Chicken Tikka Masala': 17.50,
      'Beef Tacos': 13.50,
      'Butter Chicken': 16.50,
      'Truffle Fries': 8.99,
      'Salmon Tartare': 19.50,
      'Mushroom Risotto': 22.00,
      'Peking Duck': 28.50,
      'Tom Yum Soup': 11.00
    };

    const cursor = collection.find();
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const price = prices[doc.dishName] || (Math.floor(Math.random() * 20) + 10) + 0.99;
      await collection.updateOne({ _id: doc._id }, { $set: { price: price } });
      console.log(`Updated ${doc.dishName} with price $${price}`);
    }

    console.log('Prices updated successfully.');

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
