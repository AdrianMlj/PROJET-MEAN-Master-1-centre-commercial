const mongoose = require('mongoose');

const avisSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Produit'
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique'
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  note: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  commentaire: {
    type: String,
    trim: true
  },
  reponse: {
    texte: String,
    date: Date,
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' }
  },
  est_valide: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
avisSchema.index({ produit: 1 });
avisSchema.index({ boutique: 1 });
avisSchema.index({ client: 1 });
avisSchema.index({ note: 1 });

// Compound index pour éviter les doublons
avisSchema.index({ produit: 1, client: 1 }, { unique: true, sparse: true });
avisSchema.index({ boutique: 1, client: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Avis', avisSchema);