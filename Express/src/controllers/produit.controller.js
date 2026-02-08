const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');
const CategorieProduit = require('../models/categorieProduit.model');
const mongoose = require('mongoose');

// Créer un produit (pour les boutiques)
exports.creerProduit = async (req, res) => {
  try {
    const { nom, description, prix, quantite_stock, categorie_produit, caracteristiques, tags } = req.body;

    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour créer un produit'
      });
    }

    // Vérifier la catégorie produit si spécifiée
    let categorieId = null;
    if (categorie_produit) {
      const categorie = await CategorieProduit.findOne({
        _id: categorie_produit,
        boutique: boutique._id
      });
      if (!categorie) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie produit non trouvée pour cette boutique'
        });
      }
      categorieId = categorie._id;
    }

    // Créer le produit
    const nouveauProduit = new Produit({
      nom,
      description,
      prix,
      quantite_stock: quantite_stock || 0,
      categorie_produit: categorieId,
      boutique: boutique._id,
      caracteristiques: caracteristiques || [],
      tags: tags || [],
      est_actif: true
    });

    await nouveauProduit.save();

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      produit: nouveauProduit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit',
      error: error.message
    });
  }
};

// Lister les produits avec filtres (pour tous)
exports.listerProduits = async (req, res) => {
  try {
    const { 
      boutique, 
      categorie, 
      min_prix, 
      max_prix, 
      en_promotion, 
      recherche,
      tags,
      page = 1, 
      limit = 20,
      tri = 'nouveautes'
    } = req.query;
    
    const query = { est_actif: true };
    
    // Filtrer par boutique active
    if (boutique) {
      const boutiqueDoc = await Boutique.findOne({ 
        _id: boutique, 
        est_active: true 
      });
      if (boutiqueDoc) {
        query.boutique = boutiqueDoc._id;
      }
    } else {
      // Si pas de boutique spécifique, vérifier que la boutique est active
      const boutiquesActives = await Boutique.find({ est_active: true }).select('_id');
      query.boutique = { $in: boutiquesActives.map(b => b._id) };
    }
    
    if (categorie) {
      query.categorie_produit = categorie;
    }
    
    if (min_prix || max_prix) {
      query.$or = [
        { 
          en_promotion: true,
          prix_promotion: { 
            $gte: min_prix ? parseFloat(min_prix) : 0,
            $lte: max_prix ? parseFloat(max_prix) : Number.MAX_SAFE_INTEGER
          }
        },
        {
          en_promotion: false,
          prix: { 
            $gte: min_prix ? parseFloat(min_prix) : 0,
            $lte: max_prix ? parseFloat(max_prix) : Number.MAX_SAFE_INTEGER
          }
        }
      ];
    }
    
    if (en_promotion === 'true') {
      query.en_promotion = true;
      query.date_fin_promotion = { $gte: new Date() };
      query.date_debut_promotion = { $lte: new Date() };
    }
    
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { tags: { $regex: recherche, $options: 'i' } }
      ];
    }
    
    if (tags) {
      const tagsArray = tags.split(',');
      query.tags = { $in: tagsArray };
    }
    
    let sort = {};
    switch (tri) {
      case 'prix_asc':
        sort.prix = 1;
        break;
      case 'prix_desc':
        sort.prix = -1;
        break;
      case 'nouveautes':
        sort.date_creation = -1;
        break;
      case 'ventes':
        sort['statistiques.nombre_ventes'] = -1;
        break;
      case 'note':
        sort['statistiques.note_moyenne'] = -1;
        break;
      default:
        sort.date_creation = -1;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { 
          path: 'boutique', 
          select: 'nom logo_url est_active statistiques',
          match: { est_active: true }
        },
        { 
          path: 'categorie_produit', 
          select: 'nom_categorie'
        }
      ],
      sort
    };
    
    const produits = await Produit.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...produits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};

// Obtenir un produit par ID
exports.obtenirProduit = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id)
      .populate({
        path: 'boutique',
        select: 'nom logo_url description contact adresse statistiques est_active',
        match: { est_active: true }
      })
      .populate('categorie_produit');

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que la boutique est active
    if (!produit.boutique || !produit.boutique.est_active) {
      return res.status(404).json({
        success: false,
        message: 'Produit non disponible'
      });
    }

    // Incrémenter le compteur de vues
    produit.statistiques.nombre_vues += 1;
    await produit.save();

    res.status(200).json({
      success: true,
      produit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: error.message
    });
  }
};

// Modifier un produit (pour les boutiques)
exports.modifierProduit = async (req, res) => {
  try {
    const { nom, description, prix, quantite_stock, categorie_produit, est_actif, en_promotion, prix_promotion } = req.body;

    // Récupérer le produit
    const produit = await Produit.findById(req.params.id)
      .populate('boutique');
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique._id.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }

    // Mettre à jour les informations
    if (nom) produit.nom = nom;
    if (description) produit.description = description;
    if (prix) produit.prix = prix;
    if (quantite_stock !== undefined) produit.quantite_stock = quantite_stock;
    if (categorie_produit) produit.categorie_produit = categorie_produit;
    if (est_actif !== undefined) produit.est_actif = est_actif;
    
    if (en_promotion !== undefined) {
      produit.en_promotion = en_promotion;
      if (en_promotion && prix_promotion) {
        produit.prix_promotion = prix_promotion;
        produit.date_debut_promotion = new Date();
      } else {
        produit.prix_promotion = null;
        produit.date_debut_promotion = null;
        produit.date_fin_promotion = null;
      }
    }

    await produit.save();

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès',
      produit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du produit',
      error: error.message
    });
  }
};

// Supprimer un produit (pour les boutiques)
exports.supprimerProduit = async (req, res) => {
  try {
    // Récupérer le produit
    const produit = await Produit.findById(req.params.id);
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce produit'
      });
    }

    // Désactiver plutôt que supprimer (soft delete)
    produit.est_actif = false;
    await produit.save();

    res.status(200).json({
      success: true,
      message: 'Produit désactivé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit',
      error: error.message
    });
  }
};

// Gérer le stock d'un produit
exports.gererStock = async (req, res) => {
  try {
    const { operation, quantite } = req.body;

    const produit = await Produit.findById(req.params.id);
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à gérer le stock de ce produit'
      });
    }

    // Appliquer l'opération
    if (operation === 'ajouter') {
      produit.quantite_stock += parseInt(quantite);
    } else if (operation === 'retirer') {
      if (produit.quantite_stock < quantite) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuffisant'
        });
      }
      produit.quantite_stock -= parseInt(quantite);
    } else if (operation === 'definir') {
      produit.quantite_stock = parseInt(quantite);
    }

    await produit.save();

    res.status(200).json({
      success: true,
      message: 'Stock mis à jour avec succès',
      nouveau_stock: produit.quantite_stock
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion du stock',
      error: error.message
    });
  }
};