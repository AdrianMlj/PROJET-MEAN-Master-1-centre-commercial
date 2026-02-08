const mongoose = require('mongoose');

const categorieProduitSchema = new mongoose.Schema({
  nom_categorie: {
    type: String,
    required: [true, 'Le nom de la catégorie produit est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  image_url: {
    type: String
  },
  ordre_affichage: {
    type: Number,
    default: 0
  },
  est_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Compound index pour garantir l'unicité par boutique
categorieProduitSchema.index({ nom_categorie: 1, boutique: 1 }, { unique: true });

module.exports = mongoose.model('CategorieProduit', categorieProduitSchema);