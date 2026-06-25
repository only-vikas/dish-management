const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://vikas27:Vikas2005@cluster0.xtsvrep.mongodb.net/dishdb?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('dishdb');
    const dishes = database.collection('dishes');

    const result = await dishes.updateOne(
      { dishName: 'Butter Chicken' },
      { $set: { imageUrl: '/butter_chicken.png' } }
    );
    console.log(`${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
