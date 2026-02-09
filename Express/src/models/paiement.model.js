const mongoose = require('mongoose');
const { genererReferencePaiement } = require('../utils/generateur');

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
    banque: String,
    titulaire: String
  },
  date_paiement: {
    type: Date
  },
  tentatives: [{
    date: { type: Date, default: Date.now },
    montant: Number,
    statut: String,
    message_erreur: String,
    reference_tentative: String
  }],
  informations_remboursement: {
    montant_rembourse: { type: Number, default: 0 },
    date_remboursement: Date,
    raison: String,
    reference_remboursement: String
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
paiementSchema.index({ commande: 1 });
paiementSchema.index({ statut_paiement: 1 });
paiementSchema.index({ reference_paiement: 1 });
paiementSchema.index({ 'details_paiement.derniers_4_chiffres': 1 });

// Hook pour générer la référence de paiement
paiementSchema.pre('save', function(next) {
  if (!this.reference_paiement && this.methode_paiement !== 'especes') {
    this.reference_paiement = genererReferencePaiement();
  }
  
  next();
});

// Hook pour mettre à jour le statut de paiement dans la commande
paiementSchema.post('save', async function(doc) {
  const Commande = mongoose.model('Commande');
  await Commande.findByIdAndUpdate(doc.commande, {
    'informations_paiement.statut': doc.statut_paiement,
    'informations_paiement.reference': doc.reference_paiement,
    'informations_paiement.date_paiement': doc.date_paiement
  });
});

module.exports = mongoose.model('Paiement', paiementSchema);