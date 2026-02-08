const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
  numero_commande: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique',
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'en_preparation', 'pret', 'livre', 'annule', 'refuse'],
    default: 'en_attente'
  },
  total_commande: {
    type: Number,
    required: true,
    min: [0, 'Le total ne peut pas être négatif']
  },
  frais_livraison: {
    type: Number,
    default: 0,
    min: 0
  },
  total_general: {
    type: Number,
    required: true,
    min: 0
  },
  adresse_livraison: {
    nom_complet: String,
    telephone: String,
    rue: String,
    ville: String,
    code_postal: String,
    pays: String,
    instructions: String
  },
  mode_livraison: {
    type: String,
    enum: ['retrait_boutique', 'livraison_standard', 'livraison_express'],
    default: 'livraison_standard'
  },
  notes: {
    type: String,
    trim: true
  },
  informations_paiement: {
    methode: {
      type: String,
      enum: ['carte_credit', 'especes', 'virement', 'mobile', 'carte_bancaire'],
      required: true
    },
    statut: {
      type: String,
      enum: ['en_attente', 'paye', 'echec', 'rembourse'],
      default: 'en_attente'
    },
    reference: String,
    date_paiement: Date
  },
  date_livraison_estimee: Date,
  date_livraison_reelle: Date
}, {
  timestamps: { createdAt: 'date_commande', updatedAt: 'date_modification_statut' }
});

// Indexes
commandeSchema.index({ client: 1 });
commandeSchema.index({ boutique: 1 });
commandeSchema.index({ statut: 1 });
commandeSchema.index({ date_commande: -1 });
commandeSchema.index({ numero_commande: 1 });

// Hook pour générer le numéro de commande avant la sauvegarde
commandeSchema.pre('save', async function(next) {
  if (!this.numero_commande) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.numero_commande = `CMD-${year}${month}${day}-${random}`;
  }
  
  // Calculer le total général
  this.total_general = this.total_commande + this.frais_livraison;
  
  next();
});

module.exports = mongoose.model('Commande', commandeSchema);