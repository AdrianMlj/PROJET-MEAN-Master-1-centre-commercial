const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { genererNumeroCommande } = require('../utils/generateur');

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
    nom_complet: { type: String, required: true },
    telephone: { type: String, required: true },
    rue: { type: String, required: true },
    complement: { type: String },
    ville: { type: String, required: true },
    code_postal: { type: String, required: true },
    pays: { type: String, default: 'France' },
    instructions: { type: String }
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
  date_livraison_reelle: Date,
  suivi_livraison: {
    numero_suivi: String,
    transporteur: String,
    url_suivi: String
  }
}, {
  timestamps: { createdAt: 'date_commande', updatedAt: 'date_modification_statut' }
});

commandeSchema.plugin(mongoosePaginate);


// Indexes
commandeSchema.index({ client: 1 });
commandeSchema.index({ boutique: 1 });
commandeSchema.index({ statut: 1 });
commandeSchema.index({ date_commande: -1 });
commandeSchema.index({ numero_commande: 1 });
commandeSchema.index({ 'adresse_livraison.ville': 1 });
commandeSchema.index({ 'informations_paiement.statut': 1 });

// Virtual pour le statut de livraison
commandeSchema.virtual('est_livre').get(function() {
  return this.statut === 'livre';
});

// Virtual pour le statut de paiement
commandeSchema.virtual('est_paye').get(function() {
  return this.informations_paiement.statut === 'paye';
});

// Hook pour générer le numéro de commande avant la sauvegarde
commandeSchema.pre('save', async function(next) {
  if (!this.numero_commande) {
    this.numero_commande = genererNumeroCommande();
  }
  
  // Calculer le total général
  this.total_general = this.total_commande + this.frais_livraison;
  
  // Calculer la date de livraison estimée
  if (!this.date_livraison_estimee) {
    const delai = this.mode_livraison === 'livraison_express' ? 1 : 3; // jours
    const dateLivraison = new Date();
    dateLivraison.setDate(dateLivraison.getDate() + delai);
    this.date_livraison_estimee = dateLivraison;
  }
  
  next();
});

// Hook pour mettre à jour les statistiques de la boutique après livraison
commandeSchema.post('save', async function(doc) {
  if (doc.statut === 'livre' && doc.informations_paiement.statut === 'paye') {
    const Boutique = mongoose.model('Boutique');
    await Boutique.findByIdAndUpdate(doc.boutique, {
      $inc: { 
        'statistiques.commandes_traitees': 1,
        'statistiques.chiffre_affaires': doc.total_commande
      }
    });
  }
});

module.exports = mongoose.model('Commande', commandeSchema);