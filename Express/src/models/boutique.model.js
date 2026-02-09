const mongoose = require('mongoose');

const boutiqueSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la boutique est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slogan: {
    type: String,
    trim: true
  },
  categorie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CategorieBoutique',
    required: true
  },
  logo_url: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  images: [{
    type: String
  }],
  gerant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true,
    unique: true
  },
  est_active: {
    type: Boolean,
    default: true
  },
  contact: {
    email: { type: String, lowercase: true },
    telephone: { type: String, trim: true },
    horaires: { type: String, default: 'Lundi - Vendredi: 9h-18h' }
  },
  adresse: {
    etage: { type: String, trim: true },
    numero: { type: String, trim: true },
    aile: { type: String, trim: true }
  },
  informations_bancaires: {
    iban: { type: String, trim: true },
    bic: { type: String, trim: true }
  },
  parametres: {
    frais_livraison: { type: Number, default: 0, min: 0 },
    delai_preparation: { type: Number, default: 30, min: 0 }, // en minutes
    livraison_gratuite_apres: { type: Number, default: 50, min: 0 },
    accepte_retrait: { type: Boolean, default: true },
    accepte_livraison: { type: Boolean, default: true }
  },
  statistiques: {
    note_moyenne: { type: Number, default: 0, min: 0, max: 5 },
    nombre_avis: { type: Number, default: 0, min: 0 },
    commandes_traitees: { type: Number, default: 0, min: 0 },
    produits_vendus: { type: Number, default: 0, min: 0 },
    chiffre_affaires: { type: Number, default: 0, min: 0 }
  },
  social: {
    website: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true }
  },
  date_ouverture: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
boutiqueSchema.index({ categorie: 1 });
boutiqueSchema.index({ gerant: 1 });
boutiqueSchema.index({ est_active: 1 });
boutiqueSchema.index({ 'statistiques.note_moyenne': -1 });
boutiqueSchema.index({ 'statistiques.chiffre_affaires': -1 });

// Virtual pour le nombre de produits actifs
boutiqueSchema.virtual('nombre_produits', {
  ref: 'Produit',
  localField: '_id',
  foreignField: 'boutique',
  count: true,
  match: { est_actif: true }
});

// Hook pour incrémenter le compteur de boutiques dans la catégorie
boutiqueSchema.post('save', async function(doc) {
  const CategorieBoutique = mongoose.model('CategorieBoutique');
  await CategorieBoutique.findByIdAndUpdate(doc.categorie, {
    $inc: { nombre_boutiques: 1 }
  });
});

// Hook pour décrémenter le compteur de boutiques dans la catégorie
boutiqueSchema.post('remove', async function(doc) {
  const CategorieBoutique = mongoose.model('CategorieBoutique');
  await CategorieBoutique.findByIdAndUpdate(doc.categorie, {
    $inc: { nombre_boutiques: -1 }
  });
});

module.exports = mongoose.model('Boutique', boutiqueSchema);