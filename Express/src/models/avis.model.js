const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

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

avisSchema.plugin(mongoosePaginate);

// Indexes de base
avisSchema.index({ produit: 1 });
avisSchema.index({ boutique: 1 });
avisSchema.index({ client: 1 });
avisSchema.index({ note: 1 });
avisSchema.index({ 'reponse.date': 1 });
avisSchema.index({ est_valide: 1 });

// ✅ SOLUTION : Index partiels au lieu de sparse
// Un client ne peut laisser qu'un seul avis sur un même produit
avisSchema.index(
  { produit: 1, client: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      produit: { $type: "objectId" }  // l'index ne s'applique que si produit est un ObjectId valide
    }
  }
);

// Un client ne peut laisser qu'un seul avis sur une même boutique
avisSchema.index(
  { boutique: 1, client: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      boutique: { $type: "objectId" }  // l'index ne s'applique que si boutique est un ObjectId valide
    }
  }
);

// Hook pour mettre à jour les statistiques après un avis
avisSchema.post('save', async function(doc) {
  if (doc.est_valide) {
    if (doc.produit) {
      const Produit = mongoose.model('Produit');
      // Calculer la nouvelle moyenne
      const produit = await Produit.findById(doc.produit);
      if (produit) {
        const totalNotes = (produit.statistiques.note_moyenne || 0) * (produit.statistiques.nombre_avis || 0);
        const nouvelleMoyenne = (totalNotes + doc.note) / ((produit.statistiques.nombre_avis || 0) + 1);
        
        await Produit.findByIdAndUpdate(doc.produit, {
          'statistiques.note_moyenne': nouvelleMoyenne,
          $inc: { 'statistiques.nombre_avis': 1 }
        });
      }
    }
    
    if (doc.boutique) {
      const Boutique = mongoose.model('Boutique');
      // Calculer la nouvelle moyenne
      const boutique = await Boutique.findById(doc.boutique);
      if (boutique) {
        const totalNotes = (boutique.statistiques.note_moyenne || 0) * (boutique.statistiques.nombre_avis || 0);
        const nouvelleMoyenne = (totalNotes + doc.note) / ((boutique.statistiques.nombre_avis || 0) + 1);
        
        await Boutique.findByIdAndUpdate(doc.boutique, {
          'statistiques.note_moyenne': nouvelleMoyenne,
          $inc: { 'statistiques.nombre_avis': 1 }
        });
      }
    }
  }
});

module.exports = mongoose.model('Avis', avisSchema);