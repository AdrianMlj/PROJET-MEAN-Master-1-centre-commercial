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
  },
  nombre_produits: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Compound index pour garantir l'unicité par boutique
categorieProduitSchema.index({ nom_categorie: 1, boutique: 1 }, { unique: true });

// Hook pour formater le nom
categorieProduitSchema.pre('save', function(next) {
  if (this.isModified('nom_categorie')) {
    this.nom_categorie = this.nom_categorie.charAt(0).toUpperCase() + this.nom_categorie.slice(1).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('CategorieProduit', categorieProduitSchema);