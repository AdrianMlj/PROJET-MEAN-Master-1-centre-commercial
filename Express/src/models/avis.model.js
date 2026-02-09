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
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commande'
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
  tags: [String],
  images: [{
    type: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur'
  }],
  signalements: [{
    utilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
    raison: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Indexes
avisSchema.index({ produit: 1 });
avisSchema.index({ boutique: 1 });
avisSchema.index({ client: 1 });
avisSchema.index({ note: 1 });
avisSchema.index({ 'reponse.date': 1 });
avisSchema.index({ est_valide: 1 });

// Compound index pour éviter les doublons
avisSchema.index({ produit: 1, client: 1 }, { unique: true, sparse: true });
avisSchema.index({ boutique: 1, client: 1 }, { unique: true, sparse: true });

// Hook pour mettre à jour les statistiques après un avis
avisSchema.post('save', async function(doc) {
  if (doc.est_valide) {
    if (doc.produit) {
      const Produit = mongoose.model('Produit');
      // Calculer la nouvelle moyenne
      const produit = await Produit.findById(doc.produit);
      const totalNotes = produit.statistiques.note_moyenne * produit.statistiques.nombre_avis;
      const nouvelleMoyenne = (totalNotes + doc.note) / (produit.statistiques.nombre_avis + 1);
      
      await Produit.findByIdAndUpdate(doc.produit, {
        'statistiques.note_moyenne': nouvelleMoyenne,
        $inc: { 'statistiques.nombre_avis': 1 }
      });
    }
    
    if (doc.boutique) {
      const Boutique = mongoose.model('Boutique');
      // Calculer la nouvelle moyenne
      const boutique = await Boutique.findById(doc.boutique);
      const totalNotes = boutique.statistiques.note_moyenne * boutique.statistiques.nombre_avis;
      const nouvelleMoyenne = (totalNotes + doc.note) / (boutique.statistiques.nombre_avis + 1);
      
      await Boutique.findByIdAndUpdate(doc.boutique, {
        'statistiques.note_moyenne': nouvelleMoyenne,
        $inc: { 'statistiques.nombre_avis': 1 }
      });
    }
  }
});

module.exports = mongoose.model('Avis', avisSchema);