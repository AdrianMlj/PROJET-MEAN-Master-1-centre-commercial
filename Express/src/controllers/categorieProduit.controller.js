const CategorieProduit = require('../models/categorieProduit.model');
const Boutique = require('../models/boutique.model');

// ========================================
// PUBLIC ROUTES - No authentication required
// ========================================

// Public: Lister les catégories de produits d'une boutique
exports.listerCategoriesBoutiquePublic = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(id);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }
    
    const categories = await CategorieProduit.find({ boutique: id })
      .sort({ ordre_affichage: 1, nom_categorie: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erreur liste catégories produit (public):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Public: Lister les catégories actives d'une boutique
exports.listerCategoriesBoutiquePublicActives = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(id);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }
    
    const categories = await CategorieProduit.find({ boutique: id, est_active: true })
      .sort({ ordre_affichage: 1, nom_categorie: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erreur liste catégories actives (public):', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========================================
// PROTECTED ROUTES - Authentication required
// ========================================

// Gérant: Lister les catégories de produits de sa boutique
exports.listerCategoriesBoutique = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour gérer les catégories de produits'
      });
    }
    
    const categories = await CategorieProduit.find({ boutique: boutique._id })
      .sort({ ordre_affichage: 1, nom_categorie: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erreur liste catégories produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Créer une catégorie de produits
exports.creerCategorieProduit = async (req, res) => {
  try {
    const { nom_categorie, description, image_url, ordre_affichage } = req.body;
    
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour créer des catégories de produits'
      });
    }
    
    // Validation
    if (!nom_categorie || nom_categorie.length < 2 || nom_categorie.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie doit contenir entre 2 et 100 caractères'
      });
    }
    
    // Vérifier si la catégorie existe déjà pour cette boutique
    const categorieExistante = await CategorieProduit.findOne({ 
      nom_categorie: new RegExp(`^${nom_categorie}$`, 'i'),
      boutique: boutique._id
    });
    
    if (categorieExistante) {
      return res.status(400).json({
        success: false,
        message: 'Cette catégorie existe déjà pour votre boutique'
      });
    }
    
    const nouvelleCategorie = new CategorieProduit({
      nom_categorie,
      description: description || '',
      boutique: boutique._id,
      image_url: image_url || '',
      ordre_affichage: ordre_affichage || 0,
      est_active: true
    });
    
    await nouvelleCategorie.save();
    
    res.status(201).json({
      success: true,
      message: 'Catégorie de produits créée avec succès',
      categorie: nouvelleCategorie
    });
  } catch (error) {
    console.error('Erreur création catégorie produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie de produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Modifier une catégorie de produits
exports.modifierCategorieProduit = async (req, res) => {
  try {
    const { nom_categorie, description, image_url, ordre_affichage, est_active } = req.body;
    
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour modifier des catégories de produits'
      });
    }
    
    const categorie = await CategorieProduit.findOne({
      _id: req.params.id,
      boutique: boutique._id
    });
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    // Mettre à jour
    if (nom_categorie && nom_categorie.length >= 2 && nom_categorie.length <= 100) {
      // Vérifier si le nouveau nom existe déjà (sauf pour la même catégorie)
      const categorieExistante = await CategorieProduit.findOne({ 
        nom_categorie: new RegExp(`^${nom_categorie}$`, 'i'),
        boutique: boutique._id,
        _id: { $ne: categorie._id }
      });
      
      if (categorieExistante) {
        return res.status(400).json({
          success: false,
          message: 'Cette catégorie existe déjà pour votre boutique'
        });
      }
      
      categorie.nom_categorie = nom_categorie;
    }
    
    if (description !== undefined) categorie.description = description;
    if (image_url !== undefined) categorie.image_url = image_url;
    if (ordre_affichage !== undefined) categorie.ordre_affichage = ordre_affichage;
    if (est_active !== undefined) categorie.est_active = est_active;
    
    await categorie.save();
    
    res.status(200).json({
      success: true,
      message: 'Catégorie de produits mise à jour avec succès',
      categorie
    });
  } catch (error) {
    console.error('Erreur modification catégorie produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la catégorie de produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Supprimer une catégorie de produits
exports.supprimerCategorieProduit = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour supprimer des catégories de produits'
      });
    }
    
    const categorie = await CategorieProduit.findOne({
      _id: req.params.id,
      boutique: boutique._id
    });
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    // Vérifier si des produits utilisent cette catégorie
    const Produit = require('../models/produit.model');
    const produitsAvecCategorie = await Produit.countDocuments({ 
      categorie_produit: categorie._id,
      boutique: boutique._id
    });
    
    if (produitsAvecCategorie > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car ${produitsAvecCategorie} produit(s) l'utilisent`
      });
    }
    
    await categorie.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Catégorie de produits supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression catégorie produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie de produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Obtenir une catégorie de produits
exports.obtenirCategorieProduit = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique'
      });
    }
    
    const categorie = await CategorieProduit.findOne({
      _id: req.params.id,
      boutique: boutique._id
    });
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      categorie
    });
  } catch (error) {
    console.error('Erreur obtention catégorie produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie de produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};