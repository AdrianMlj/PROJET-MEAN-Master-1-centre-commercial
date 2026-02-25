const Favoris = require('../models/favoris.model');
const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');

// Ajouter un produit aux favoris
exports.ajouterProduitFavori = async (req, res) => {
  try {
    const { produitId } = req.body;

    if (!produitId) {
      return res.status(400).json({
        success: false,
        message: 'ID produit requis'
      });
    }

    // Vérifier que le produit existe
    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si le produit est déjà dans les favoris
    const favoriExistant = await Favoris.findOne({
      client: req.user.id,
      produit: produitId
    });

    if (favoriExistant) {
      return res.status(400).json({
        success: false,
        message: 'Ce produit est déjà dans vos favoris'
      });
    }

    // Créer le favori
    const nouveauFavori = new Favoris({
      client: req.user.id,
      produit: produitId
    });

    await nouveauFavori.save();

    res.status(201).json({
      success: true,
      message: 'Produit ajouté aux favoris',
      favori: nouveauFavori
    });
  } catch (error) {
    console.error('Erreur ajout favori:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout aux favoris',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ajouter une boutique aux favoris
exports.ajouterBoutiqueFavori = async (req, res) => {
  try {
    const { boutiqueId } = req.body;

    if (!boutiqueId) {
      return res.status(400).json({
        success: false,
        message: 'ID boutique requis'
      });
    }

    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Vérifier si la boutique est déjà dans les favoris
    const favoriExistant = await Favoris.findOne({
      client: req.user.id,
      boutique: boutiqueId
    });

    if (favoriExistant) {
      return res.status(400).json({
        success: false,
        message: 'Cette boutique est déjà dans vos favoris'
      });
    }

    // Créer le favori
    const nouveauFavori = new Favoris({
      client: req.user.id,
      boutique: boutiqueId
    });

    await nouveauFavori.save();

    res.status(201).json({
      success: true,
      message: 'Boutique ajoutée aux favoris',
      favori: nouveauFavori
    });
  } catch (error) {
    console.error('Erreur ajout favori boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout aux favoris',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Obtenir tous les favoris de l'utilisateur connecté
// ============================================
exports.obtenirFavoris = async (req, res) => {
  try {
    const favoris = await Favoris.find({ client: req.user.id })
      .populate({
        path: 'produit',
        select: 'nom prix prix_promotion en_promotion images boutique est_actif',
        populate: {
          path: 'boutique',
          select: 'nom logo_url est_active'
        }
      })
      .populate({
        path: 'boutique',
        select: 'nom logo_url description categorie est_active statistiques',
        populate: {
          path: 'categorie',
          select: 'nom_categorie icone'
        }
      })
      .sort({ date_ajout: -1 });

    // Séparer les favoris valides
    const produitsFavoris = favoris
      .filter(f => f.produit && f.produit.est_actif && f.produit.boutique?.est_active)
      .map(f => f.produit);

    const boutiquesFavoris = favoris
      .filter(f => f.boutique && f.boutique.est_active)
      .map(f => f.boutique);

    res.status(200).json({
      success: true,
      produits: produitsFavoris,
      boutiques: boutiquesFavoris,
      total: favoris.length
    });

  } catch (error) {
    console.error('Erreur obtention favoris:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des favoris',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retirer un produit des favoris
exports.retirerProduitFavori = async (req, res) => {
  try {
    const { produitId } = req.params;

    const favori = await Favoris.findOneAndDelete({
      client: req.user.id,
      produit: produitId
    });

    if (!favori) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé dans vos favoris'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Produit retiré des favoris'
    });
  } catch (error) {
    console.error('Erreur retrait favori:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait des favoris',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retirer une boutique des favoris
exports.retirerBoutiqueFavori = async (req, res) => {
  try {
    const { boutiqueId } = req.params;

    const favori = await Favoris.findOneAndDelete({
      client: req.user.id,
      boutique: boutiqueId
    });

    if (!favori) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée dans vos favoris'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Boutique retirée des favoris'
    });
  } catch (error) {
    console.error('Erreur retrait favori boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du retrait des favoris',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vérifier si un produit est dans les favoris
exports.verifierProduitFavori = async (req, res) => {
  try {
    const { produitId } = req.params;

    const favori = await Favoris.findOne({
      client: req.user.id,
      produit: produitId
    });

    res.status(200).json({
      success: true,
      est_favori: !!favori
    });
  } catch (error) {
    console.error('Erreur vérification favori:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Vérifier si une boutique est dans les favoris
exports.verifierBoutiqueFavori = async (req, res) => {
  try {
    const { boutiqueId } = req.params;

    const favori = await Favoris.findOne({
      client: req.user.id,
      boutique: boutiqueId
    });

    res.status(200).json({
      success: true,
      est_favori: !!favori
    });
  } catch (error) {
    console.error('Erreur vérification favori boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};