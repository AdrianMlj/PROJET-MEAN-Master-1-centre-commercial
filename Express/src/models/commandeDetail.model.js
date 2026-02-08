const mongoose = require('mongoose');

const commandeDetailSchema = new mongoose.Schema({
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    required: true
  },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit',
    required: true
  },
  quantite: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1']
  },
  prix_unitaire: {
    type: Number,
    required: true,
    min: [0, 'Le prix unitaire ne peut pas être négatif']
  },
  sous_total: {
    type: Number,
    required: true,
    min: [0, 'Le sous-total ne peut pas être négatif']
  },
  nom_produit: {
    type: String,
    required: true
  },
  image_produit: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
commandeDetailSchema.index({ commande: 1 });
commandeDetailSchema.index({ produit: 1 });

// Calcul automatique du sous-total
commandeDetailSchema.pre('save', function(next) {
  this.sous_total = this.prix_unitaire * this.quantite;
  next();
});

module.exports = mongoose.model('CommandeDetail', commandeDetailSchema);