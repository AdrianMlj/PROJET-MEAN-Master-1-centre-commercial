const mongoose = require('mongoose');

const panierSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Utilisateur',
    required: true
  },
  elements: [{
    produit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Produit',
      required: true
    },
    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité doit être au moins 1'],
      default: 1
    },
    prix_unitaire: {
      type: Number,
      required: true
    },
    date_ajout: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    }
  }],
  date_modification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

// Index
panierSchema.index({ client: 1 }, { unique: true });

// Virtual pour le total du panier
panierSchema.virtual('total').get(function() {
  return this.elements.reduce((total, element) => {
    return total + (element.prix_unitaire * element.quantite);
  }, 0);
});

// Virtual pour le nombre d'articles
panierSchema.virtual('nombre_articles').get(function() {
  return this.elements.reduce((total, element) => {
    return total + element.quantite;
  }, 0);
});

// Méthode pour ajouter un produit
panierSchema.methods.ajouterProduit = async function(produitId, quantite, prixUnitaire) {
  const existingElement = this.elements.find(element => 
    element.produit.toString() === produitId.toString()
  );
  
  if (existingElement) {
    existingElement.quantite += quantite;
    existingElement.date_ajout = new Date();
  } else {
    this.elements.push({
      produit: produitId,
      quantite: quantite,
      prix_unitaire: prixUnitaire
    });
  }
  
  this.date_modification = new Date();
  return this.save();
};

// Méthode pour retirer un produit
panierSchema.methods.retirerProduit = function(produitId) {
  this.elements = this.elements.filter(element => 
    element.produit.toString() !== produitId.toString()
  );
  this.date_modification = new Date();
  return this.save();
};

// Méthode pour mettre à jour la quantité
panierSchema.methods.mettreAJourQuantite = function(produitId, nouvelleQuantite) {
  const element = this.elements.find(element => 
    element.produit.toString() === produitId.toString()
  );
  
  if (element) {
    element.quantite = nouvelleQuantite;
    element.date_ajout = new Date();
    this.date_modification = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Panier', panierSchema);