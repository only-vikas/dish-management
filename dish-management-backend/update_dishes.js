const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb://127.0.0.1:27017/dish-management';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('dishes');

    // Descriptions to apply
    const descriptions = {
      'Margherita Pizza': 'Classic Italian pizza with fresh tomatoes, mozzarella, and basil.',
      'Spaghetti Carbonara': 'Traditional Roman pasta dish with egg, cheese, pancetta, and black pepper.',
      'Caesar Salad': 'Crisp romaine lettuce tossed in creamy Caesar dressing with parmesan and croutons.',
      'Chicken Tikka Masala': 'Roasted marinated chicken chunks in a spiced curry sauce.',
      'Sushi Platter': 'An assortment of fresh nigiri and maki rolls, served with soy sauce and wasabi.',
      'Pad Thai': 'Stir-fried rice noodles with eggs, peanuts, bean sprouts, and chicken.',
      'French Onion Soup': 'Rich beef broth with caramelized onions, topped with croutons and melted gruyere.',
      'Butter Chicken': 'Tender chicken simmered in a creamy, mildly spiced tomato sauce.',
      'Chocolate Lava Cake': 'Warm chocolate cake with a gooey, molten center, served with vanilla ice cream.'
    };

    // First replace Beef Tacos with Bisi Bele Bath
    await collection.updateOne(
      { dishName: 'Beef Tacos' },
      { 
        $set: { 
          dishName: 'Bisi Bele Bath', 
          description: 'A traditional spicy, tangy, and flavorful rice-lentil dish from Karnataka.',
          price: 14.50
        }
      }
    );

    // Update descriptions for the rest
    const cursor = collection.find();
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (descriptions[doc.dishName]) {
        await collection.updateOne(
          { _id: doc._id }, 
          { $set: { description: descriptions[doc.dishName] } }
        );
      }
    }

    console.log('Dishes updated successfully.');

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
