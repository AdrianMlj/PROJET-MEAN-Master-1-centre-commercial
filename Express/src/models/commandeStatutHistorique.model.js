const mongoose = require('mongoose');

const commandeStatutHistoriqueSchema = new mongoose.Schema({
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    required: true
  },
  ancien_statut: {
    type: String,
    enum: ['en_attente', 'en_preparation', 'pret', 'livre', 'annule', 'refuse']
  },
  nouveau_statut: {
    type: String,
    enum: ['en_attente', 'en_preparation', 'pret', 'livre', 'annule', 'refuse'],
    required: true
  },
  utilisateur_modif: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  },
  raison: {
    type: String,
    trim: true
  },
  notes_internes: {
    type: String,
    trim: true
  }
}, {
  timestamps: { createdAt: 'date_modification' }
});

// Indexes
commandeStatutHistoriqueSchema.index({ commande: 1 });
commandeStatutHistoriqueSchema.index({ date_modification: -1 });

module.exports = mongoose.model('CommandeStatutHistorique', commandeStatutHistoriqueSchema);