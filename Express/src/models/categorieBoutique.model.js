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
  },
  image_url: {
    type: String,
  },
  est_active: {
    type: Boolean,
    default: true
  },
  ordre_affichage: {
    type: Number,
    default: 0
  },
  nombre_boutiques: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Hook pour formater le nom
categorieBoutiqueSchema.pre('save', function(next) {
  if (this.isModified('nom_categorie')) {
    this.nom_categorie = this.nom_categorie.charAt(0).toUpperCase() + this.nom_categorie.slice(1).toLowerCase();
  }
  next();
});

module.exports = mongoose.model('CategorieBoutique', categorieBoutiqueSchema);