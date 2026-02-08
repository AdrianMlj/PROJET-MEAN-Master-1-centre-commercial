const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  description_detaillee: {
    type: String
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est requis'],
    min: [0, 'Le prix ne peut pas être négatif']
  },
  prix_promotion: {
    type: Number,
    min: [0, 'Le prix promotionnel ne peut pas être négatif']
  },
  en_promotion: {
    type: Boolean,
    default: false
  },
  quantite_stock: {
    type: Number,
    required: [true, 'La quantité en stock est requise'],
    min: [0, 'La quantité ne peut pas être négative'],
    default: 0
  },
  seuil_alerte: {
    type: Number,
    default: 5
  },
  images: [{
    url: String,
    ordre: Number,
    is_principale: { type: Boolean, default: false }
  }],
  categorie_produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategorieProduit'
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  est_actif: {
    type: Boolean,
    default: true
  },
  caracteristiques: [{
    nom: String,
    valeur: String
  }],
  tags: [String],
  statistiques: {
    nombre_vues: { type: Number, default: 0 },
    nombre_ventes: { type: Number, default: 0 },
    note_moyenne: { type: Number, default: 0, min: 0, max: 5 }
  },
  date_debut_promotion: Date,
  date_fin_promotion: Date
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
produitSchema.index({ boutique: 1 });
produitSchema.index({ categorie_produit: 1 });
produitSchema.index({ est_actif: 1 });
produitSchema.index({ en_promotion: 1 });
produitSchema.index({ 'statistiques.nombre_ventes': -1 });

// Virtual pour le prix affiché
produitSchema.virtual('prix_final').get(function() {
  return this.en_promotion && this.prix_promotion ? this.prix_promotion : this.prix;
});

// Virtual pour vérifier la disponibilité
produitSchema.virtual('est_disponible').get(function() {
  return this.est_actif && this.quantite_stock > 0;
});

module.exports = mongoose.model('Produit', produitSchema);