const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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
    type: String,
    trim: true
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
    url: { type: String, required: true },
    ordre: { type: Number, default: 0 },
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
    nom: { type: String, required: true },
    valeur: { type: String, required: true },
    unite: { type: String }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  statistiques: {
    nombre_vues: { type: Number, default: 0, min: 0 },
    nombre_ventes: { type: Number, default: 0, min: 0 },
    note_moyenne: { type: Number, default: 0, min: 0, max: 5 },
    nombre_avis: { type: Number, default: 0, min: 0 }
  },
  date_debut_promotion: {
    type: Date
  },
  date_fin_promotion: {
    type: Date
  },
  code_produit: {
    type: String,
    unique: true,
    sparse: true
  },
  poids: {
    type: Number,
    min: 0
  },
  dimensions: {
    longueur: { type: Number, min: 0 },
    largeur: { type: Number, min: 0 },
    hauteur: { type: Number, min: 0 }
  }
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
produitSchema.index({ 'statistiques.note_moyenne': -1 });
produitSchema.index({ tags: 1 });
produitSchema.index({ nom: 'text', description: 'text', tags: 'text' });

// Virtual pour le prix affiché
produitSchema.virtual('prix_final').get(function() {
  if (this.en_promotion && this.prix_promotion && this.prix_promotion < this.prix) {
    return this.prix_promotion;
  }
  return this.prix;
});

// Virtual pour vérifier la disponibilité
produitSchema.virtual('est_disponible').get(function() {
  return this.est_actif && this.quantite_stock > 0;
});

// Virtual pour le pourcentage de réduction
produitSchema.virtual('pourcentage_reduction').get(function() {
  if (this.en_promotion && this.prix_promotion && this.prix_promotion < this.prix) {
    const reduction = this.prix - this.prix_promotion;
    return Math.round((reduction / this.prix) * 100);
  }
  return 0;
});

// Hook pour générer le code produit avant la sauvegarde
produitSchema.pre('save', async function(next) {
  if (!this.code_produit) {
    const { genererCodeProduit } = require('../utils/generateur');
    this.code_produit = genererCodeProduit(this.boutique);
  }
  
  // Vérifier si la promotion est valide
  if (this.en_promotion && this.prix_promotion && this.prix_promotion >= this.prix) {
    this.en_promotion = false;
    this.prix_promotion = null;
  }
  
  next();
});

// Hook pour incrémenter le compteur de produits dans la catégorie
produitSchema.post('save', async function(doc) {
  if (doc.categorie_produit) {
    const CategorieProduit = mongoose.model('CategorieProduit');
    await CategorieProduit.findByIdAndUpdate(doc.categorie_produit, {
      $inc: { nombre_produits: 1 }
    });
  }
});

module.exports = mongoose.model('Produit', produitSchema);