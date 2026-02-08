const mongoose = require('mongoose');

const favorisSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique'
  }
}, {
  timestamps: { createdAt: 'date_ajout' }
});

// Indexes
favorisSchema.index({ client: 1, produit: 1 }, { unique: true, sparse: true });
favorisSchema.index({ client: 1, boutique: 1 }, { unique: true, sparse: true });
favorisSchema.index({ client: 1 });

module.exports = mongoose.model('Favoris', favorisSchema);