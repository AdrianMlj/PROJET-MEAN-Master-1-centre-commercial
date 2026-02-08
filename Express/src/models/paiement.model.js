const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande',
    required: true,
    unique: true
  },
  montant: {
    type: Number,
    required: true,
    min: [0, 'Le montant ne peut pas être négatif']
  },
  methode_paiement: {
    type: String,
    enum: ['carte_credit', 'especes', 'virement', 'mobile', 'carte_bancaire'],
    required: true
  },
  statut_paiement: {
    type: String,
    enum: ['en_attente', 'paye', 'echec', 'rembourse', 'partiel'],
    default: 'en_attente'
  },
  reference_paiement: {
    type: String,
    unique: true,
    sparse: true
  },
  details_paiement: {
    derniers_4_chiffres: String,
    nom_carte: String,
    date_expiration: String,
    banque: String
  },
  date_paiement: {
    type: Date
  },
  tentatives: [{
    date: { type: Date, default: Date.now },
    montant: Number,
    statut: String,
    message_erreur: String
  }]
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
paiementSchema.index({ commande: 1 });
paiementSchema.index({ statut_paiement: 1 });
paiementSchema.index({ reference_paiement: 1 });

module.exports = mongoose.model('Paiement', paiementSchema);