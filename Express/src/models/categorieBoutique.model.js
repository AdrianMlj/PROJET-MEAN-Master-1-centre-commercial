const mongoose = require('mongoose');

const categorieBoutiqueSchema = new mongoose.Schema({
  nom_categorie: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icone: {
    type: String,
    default: '🛍️'
  },
  image_url: {
    type: String
  },
  est_active: {
    type: Boolean,
    default: true
  },
  ordre_affichage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

module.exports = mongoose.model('CategorieBoutique', categorieBoutiqueSchema);