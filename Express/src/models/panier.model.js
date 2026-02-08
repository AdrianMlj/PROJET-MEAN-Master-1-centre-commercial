const mongoose = require('mongoose');

const panierSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  elements: [{
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: true
    },
    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité doit être au moins 1'],
      default: 1
    },
    prix_unitaire: {
      type: Number,
      required: true
    },
    date_ajout: {
      type: Date,
      default: Date.now
    }
  }],
  date_modification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Index
panierSchema.index({ client: 1 }, { unique: true });

// Virtual pour le total du panier
panierSchema.virtual('total').get(function() {
  return this.elements.reduce((total, element) => {
    return total + (element.prix_unitaire * element.quantite);
  }, 0);
});

module.exports = mongoose.model('Panier', panierSchema);