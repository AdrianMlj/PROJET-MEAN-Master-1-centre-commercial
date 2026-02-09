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

// Validation pour s'assurer qu'au moins un des deux est présent
favorisSchema.pre('validate', function(next) {
  if (!this.produit && !this.boutique) {
    next(new Error('Au moins un produit ou une boutique doit être spécifié'));
  } else if (this.produit && this.boutique) {
    next(new Error('Un favori ne peut pas référencer à la fois un produit et une boutique'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Favoris', favorisSchema);