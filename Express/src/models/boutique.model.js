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
    email: String,
    telephone: String,
    horaires: String
  },
  adresse: {
    etage: String,
    numero: String,
    aile: String
  },
  informations_bancaires: {
    iban: String,
    bic: String
  },
  parametres: {
    frais_livraison: { type: Number, default: 0 },
    delai_preparation: { type: Number, default: 30 }, // en minutes
    livraison_gratuite_apres: { type: Number, default: 50 }
  },
  statistiques: {
    note_moyenne: { type: Number, default: 0, min: 0, max: 5 },
    nombre_avis: { type: Number, default: 0 },
    commandes_traitees: { type: Number, default: 0 }
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
boutiqueSchema.index({ categorie: 1 });
boutiqueSchema.index({ gerant: 1 });
boutiqueSchema.index({ est_active: 1 });
boutiqueSchema.index({ 'statistiques.note_moyenne': -1 });

module.exports = mongoose.model('Boutique', boutiqueSchema);