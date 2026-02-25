const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['paiement_location', 'nouvelle_boutique', 'commande', 'alerte'],
    required: true
  },
  titre: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  donnees: {
    type: mongoose.Schema.Types.Mixed // infos supplémentaires (id boutique, montant, etc.)
  },
  lu: {
    type: Boolean,
    default: false
  },
  date_creation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: false }
});

// Index pour requêtes rapides
notificationSchema.index({ destinataire: 1, lu: 1, date_creation: -1 });

module.exports = mongoose.model('Notification', notificationSchema);