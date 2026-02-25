const Panier = require('../models/panier.model');
const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');

// Obtenir le panier de l'utilisateur
exports.obtenirPanier = async (req, res) => {
  try {
    const panier = await Panier.findOne({ client: req.user.id })
      .populate({
        path: 'elements.produit',
        select: 'nom prix prix_promotion en_promotion images quantite_stock boutique est_actif',
        populate: {
          path: 'boutique',
          select: 'nom logo_url est_active'
        }
      });

    if (!panier) {
      // Créer un panier vide si aucun n'existe
      const nouveauPanier = new Panier({
        client: req.user.id,
        elements: []
      });
      await nouveauPanier.save();
      
      return res.status(200).json({
        success: true,
        panier: nouveauPanier,
        total: 0,
        nombre_articles: 0
      });
    }

    // Filtrer les produits inactifs ou dont la boutique est inactive
    const elementsValides = panier.elements.filter(element => {
      return element.produit && 
             element.produit.est_actif &&
             element.produit.boutique &&
             element.produit.boutique.est_active &&
             element.produit.quantite_stock >= element.quantite;
    });

    // Ajuster les quantités si le stock est insuffisant
    for (const element of elementsValides) {
      if (element.produit.quantite_stock < element.quantite) {
        element.quantite = element.produit.quantite_stock;
      }
    }

    // Mettre à jour le panier si des modifications ont été faites
    if (elementsValides.length !== panier.elements.length) {
      panier.elements = elementsValides;
      panier.date_modification = new Date();
      await panier.save();
    }

    // Calculer le total
    const total = panier.elements.reduce((sum, element) => {
      const prix = element.produit.en_promotion && element.produit.prix_promotion 
        ? element.produit.prix_promotion 
        : element.produit.prix;
      return sum + (prix * element.quantite);
    }, 0);

    // Calculer le nombre d'articles
    const nombreArticles = panier.elements.reduce((sum, element) => sum + element.quantite, 0);

    res.status(200).json({
      success: true,
      panier,
      total,
      nombre_articles: nombreArticles
    });
  } catch (error) {
    console.error('Erreur obtention panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du panier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ajouter un produit au panier
exports.ajouterAuPanier = async (req, res) => {
  try {
    const { produitId, quantite } = req.body;

    if (!produitId) {
      return res.status(400).json({
        success: false,
        message: 'ID produit requis'
      });
    }

    const quantiteNum = parseInt(quantite) || 1;
    
    if (quantiteNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'La quantité doit être au moins 1'
      });
    }

    // Vérifier que le produit existe et est disponible
    const produit = await Produit.findById(produitId)
      .populate('boutique');
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    if (!produit.est_actif) {
      return res.status(400).json({
        success: false,
        message: 'Ce produit n\'est plus disponible'
      });
    }

    if (!produit.boutique.est_active) {
      return res.status(400).json({
        success: false,
        message: 'La boutique de ce produit est fermée'
      });
    }

    if (produit.quantite_stock < quantiteNum) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Il ne reste que ${produit.quantite_stock} unité(s)`
      });
    }

    // Obtenir ou créer le panier
    let panier = await Panier.findOne({ client: req.user.id });
    
    if (!panier) {
      panier = new Panier({
        client: req.user.id,
        elements: []
      });
    }

    // Vérifier si le produit est déjà dans le panier
    const elementExistant = panier.elements.find(element => 
      element.produit.toString() === produitId
    );

    if (elementExistant) {
      // Mettre à jour la quantité
      const nouvelleQuantite = elementExistant.quantite + quantiteNum;
      
      // Vérifier le stock
      if (produit.quantite_stock < nouvelleQuantite) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ajouter cette quantité. Maximum disponible: ${produit.quantite_stock}`
        });
      }
      
      elementExistant.quantite = nouvelleQuantite;
      elementExistant.date_ajout = new Date();
    } else {
      // Ajouter le produit au panier
      const prixUnitaire = produit.en_promotion && produit.prix_promotion 
        ? produit.prix_promotion 
        : produit.prix;
      
      panier.elements.push({
        produit: produit._id,
        quantite: quantiteNum,
        prix_unitaire: prixUnitaire,
        date_ajout: new Date()
      });
    }

    panier.date_modification = new Date();
    await panier.save();

    // Recharger le panier avec les informations du produit
    await panier.populate({
      path: 'elements.produit',
      select: 'nom prix prix_promotion en_promotion images boutique',
      populate: {
        path: 'boutique',
        select: 'nom logo_url'
      }
    });

    // Calculer le total
    const total = panier.elements.reduce((sum, element) => {
      return sum + (element.prix_unitaire * element.quantite);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Produit ajouté au panier avec succès',
      panier,
      total
    });
  } catch (error) {
    console.error('Erreur ajout panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout au panier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Modifier la quantité d'un produit dans le panier
exports.modifierQuantitePanier = async (req, res) => {
  try {
    const { quantite } = req.body;
    const { elementId } = req.params;

    if (!quantite || quantite < 1) {
      return res.status(400).json({
        success: false,
        message: 'La quantité doit être au moins 1'
      });
    }

    const quantiteNum = parseInt(quantite);

    // Récupérer le panier
    const panier = await Panier.findOne({ client: req.user.id });
    
    if (!panier) {
      return res.status(404).json({
        success: false,
        message: 'Panier non trouvé'
      });
    }

    // Trouver l'élément
    const element = panier.elements.id(elementId);
    if (!element) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé dans le panier'
      });
    }

    // Vérifier le produit
    const produit = await Produit.findById(element.produit)
      .populate('boutique');
    
    if (!produit || !produit.est_actif) {
      // Retirer l'élément si le produit n'est plus disponible
      panier.elements.pull(elementId);
      await panier.save();
      
      return res.status(400).json({
        success: false,
        message: 'Ce produit n\'est plus disponible. Il a été retiré de votre panier.'
      });
    }

    // Vérifier que la boutique est active
    if (!produit.boutique.est_active) {
      panier.elements.pull(elementId);
      await panier.save();
      
      return res.status(400).json({
        success: false,
        message: 'La boutique de ce produit est fermée. Le produit a été retiré de votre panier.'
      });
    }

    // Vérifier le stock
    if (produit.quantite_stock < quantiteNum) {
      return res.status(400).json({
        success: false,
        message: `Stock insuffisant. Il ne reste que ${produit.quantite_stock} unité(s)`
      });
    }

    // Mettre à jour la quantité
    element.quantite = quantiteNum;
    element.date_ajout = new Date();
    element.prix_unitaire = produit.en_promotion && produit.prix_promotion 
      ? produit.prix_promotion 
      : produit.prix;
    
    panier.date_modification = new Date();
    await panier.save();

    // Recharger le panier
    await panier.populate({
      path: 'elements.produit',
      select: 'nom prix prix_promotion en_promotion images boutique',
      populate: {
        path: 'boutique',
        select: 'nom logo_url'
      }
    });

    // Calculer le total
    const total = panier.elements.reduce((sum, element) => {
      return sum + (element.prix_unitaire * element.quantite);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Quantité mise à jour avec succès',
      panier,
      total
    });
  } catch (error) {
    console.error('Erreur modification quantité panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la quantité',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retirer un produit du panier
exports.retirerDuPanier = async (req, res) => {
  try {
    const { elementId } = req.params;

    const panier = await Panier.findOne({ client: req.user.id });
    
    if (!panier) {
      return res.status(404).json({
        success: false,
        message: 'Panier non trouvé'
      });
    }

    // Vérifier que l'élément existe
    const element = panier.elements.id(elementId);
    if (!element) {
      return res.status(404).json({
        success: false,
        message: 'Élément non trouvé dans le panier'
      });
    }

    // Retirer l'élément
    panier.elements.pull(elementId);
    panier.date_modification = new Date();
    await panier.save();

    // Recharger le panier
    await panier.populate({
      path: 'elements.produit',
      select: 'nom prix prix_promotion en_promotion images boutique',
      populate: {
        path: 'boutique',
        select: 'nom logo_url'
      }
    });

    // Calculer le total
    const total = panier.elements.reduce((sum, element) => {
      return sum + (element.prix_unitaire * element.quantite);
    }, 0);

    res.status(200).json({
      success: true,
      message: 'Produit retiré du panier avec succès',
      panier,
      total
    });
  } catch (error) {
    console.error('Erreur retrait panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vider le panier
exports.viderPanier = async (req, res) => {
  try {
    const panier = await Panier.findOne({ client: req.user.id });
    
    if (!panier) {
      return res.status(404).json({
        success: false,
        message: 'Panier non trouvé'
      });
    }

    panier.elements = [];
    panier.date_modification = new Date();
    await panier.save();

    res.status(200).json({
      success: true,
      message: 'Panier vidé avec succès',
      panier
    });
  } catch (error) {
    console.error('Erreur vidage panier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage du panier',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Calculer le total du panier avec détails par boutique
exports.calculerTotal = async (req, res) => {
  try {
    const panier = await Panier.findOne({ client: req.user.id })
      .populate({
        path: 'elements.produit',
        select: 'prix prix_promotion en_promotion boutique',
        populate: {
          path: 'boutique',
          select: 'nom parametres'
        }
      });

    if (!panier || panier.elements.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        frais_livraison: 0,
        total_general: 0,
        detail_par_boutique: []
      });
    }

    // Calculer le total par boutique
    const totalsParBoutique = {};
    
    panier.elements.forEach(element => {
      if (element.produit && element.produit.boutique) {
        const boutiqueId = element.produit.boutique._id.toString();
        const prixProduit = element.produit.en_promotion && element.produit.prix_promotion 
          ? element.produit.prix_promotion 
          : element.produit.prix;
        
        if (!totalsParBoutique[boutiqueId]) {
          totalsParBoutique[boutiqueId] = {
            boutique: element.produit.boutique,
            total: 0,
            frais_livraison: 0
          };
        }
        
        totalsParBoutique[boutiqueId].total += prixProduit * element.quantite;
      }
    });

    // Calculer les frais de livraison par boutique
    let totalGeneral = 0;
    let totalLivraison = 0;
    const detailParBoutique = [];
    
    Object.values(totalsParBoutique).forEach(item => {
      // Appliquer les frais de livraison de la boutique
      const seuilLivraisonGratuite = item.boutique.parametres?.livraison_gratuite_apres || 50;
      const fraisLivraison = item.total >= seuilLivraisonGratuite 
        ? 0 
        : (item.boutique.parametres?.frais_livraison || 5);
      
      item.frais_livraison = fraisLivraison;
      item.total_general = item.total + fraisLivraison;
      
      detailParBoutique.push(item);
      totalGeneral += item.total_general;
      totalLivraison += fraisLivraison;
    });

    const totalProduits = Object.values(totalsParBoutique).reduce((sum, item) => sum + item.total, 0);

    res.status(200).json({
      success: true,
      total_produits: totalProduits,
      frais_livraison_total: totalLivraison,
      total_general: totalGeneral,
      detail_par_boutique: detailParBoutique,
      nombre_boutiques: detailParBoutique.length
    });
  } catch (error) {
    console.error('Erreur calcul total:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du total',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir le nombre d'articles dans le panier
exports.obtenirNombreArticles = async (req, res) => {
  try {
    const panier = await Panier.findOne({ client: req.user.id });
    
    let nombreArticles = 0;
    if (panier) {
      nombreArticles = panier.elements.reduce((sum, element) => sum + element.quantite, 0);
    }

    res.status(200).json({
      success: true,
      nombre_articles: nombreArticles
    });
  } catch (error) {
    console.error('Erreur nombre articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre d\'articles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};