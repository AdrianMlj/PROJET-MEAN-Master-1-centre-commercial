const mongoose = require("mongoose");

// Activer la pagination pour tous les modeles
mongoose.plugin(require('mongoose-paginate-v2'));

// Configuration Mongoose
mongoose.set('strictQuery', true);

const ensureFavorisIndexes = async () => {
  try {
    const collection = mongoose.connection.collection('favoris');
    const existing = await collection.indexes();
    const names = new Set(existing.map((idx) => idx.name));

    if (names.has('client_1_produit_1')) {
      await collection.dropIndex('client_1_produit_1');
    }
    if (names.has('client_1_boutique_1')) {
      await collection.dropIndex('client_1_boutique_1');
    }

    await collection.createIndex(
      { client: 1, produit: 1 },
      { unique: true, partialFilterExpression: { produit: { $type: 'objectId' } } }
    );
    await collection.createIndex(
      { client: 1, boutique: 1 },
      { unique: true, partialFilterExpression: { boutique: { $type: 'objectId' } } }
    );

    console.log('Index favoris verifies/migres');
  } catch (error) {
    console.error('Erreur migration index favoris:', error.message);
  }
};

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connecte");
    await ensureFavorisIndexes();
  } catch (error) {
    console.error("Erreur MongoDB", error.message);
    process.exit(1);
  }
};
