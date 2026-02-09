const mongoose = require("mongoose");

// Activer la pagination pour tous les modèles
mongoose.plugin(require('mongoose-paginate-v2'));

// Configuration Mongoose
mongoose.set('strictQuery', true);

module.exports = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté");
  } catch (error) {
    console.error("❌ Erreur MongoDB", error.message);
    process.exit(1);
  }
};