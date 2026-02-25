const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const utilisateurSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  mot_de_passe_hash: {
    type: String,
    required: [true, 'Le mot de passe est requis']
  },
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  prenom: {
    type: String,
    trim: true
  },
  telephone: {
    type: String,
    trim: true
  },
  adresse: {
    rue: { type: String, trim: true },
    ville: { type: String, trim: true },
    code_postal: { type: String, trim: true },
    pays: { type: String, trim: true, default: 'France' }
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  est_actif: {
    type: Boolean,
    default: true
  },
  boutique_associee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boutique'
  },
  avatar_url: {
    type: String,
    default: null
  },
  date_naissance: {
    type: Date
  },
  preferences: {
    newsletter: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    langue: { type: String, default: 'fr' }
  },
  date_derniere_connexion: {
    type: Date
  },
  verifie_email: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

utilisateurSchema.plugin(mongoosePaginate);

// Indexes
utilisateurSchema.index({ email: 1 });
utilisateurSchema.index({ role: 1 });
utilisateurSchema.index({ est_actif: 1 });
utilisateurSchema.index({ boutique_associee: 1 });

// Méthode pour masquer le mot de passe
utilisateurSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.mot_de_passe_hash;
  return obj;
};

module.exports = mongoose.model('Utilisateur', utilisateurSchema);