const mongoose = require('mongoose');

const panierElementSchema = new mongoose.Schema({
  panier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Panier',
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
    min: [1, 'La quantité doit être au moins 1'],
    default: 1
  },
  prix_unitaire: {
    type: Number,
    required: true,
    min: [0, 'Le prix unitaire ne peut pas être négatif']
  },
  date_ajout: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    trim: true
  },
  caracteristiques_choisies: [{
    nom: String,
    valeur: String
  }]
}, {
  timestamps: true
});

// Indexes
panierElementSchema.index({ panier: 1, produit: 1 }, { unique: true });
panierElementSchema.index({ panier: 1 });
panierElementSchema.index({ produit: 1 });

// Virtual pour le sous-total
panierElementSchema.virtual('sous_total').get(function() {
  return this.prix_unitaire * this.quantite;
});

// Hook pour mettre à jour le panier lors de la modification
panierElementSchema.post('save', async function(doc) {
  const Panier = mongoose.model('Panier');
  await Panier.findByIdAndUpdate(doc.panier, {
    date_modification: new Date()
  });
});

// Hook pour mettre à jour le panier lors de la suppression
panierElementSchema.post('remove', async function(doc) {
  const Panier = mongoose.model('Panier');
  await Panier.findByIdAndUpdate(doc.panier, {
    date_modification: new Date()
  });
});

module.exports = mongoose.model('PanierElement', panierElementSchema);