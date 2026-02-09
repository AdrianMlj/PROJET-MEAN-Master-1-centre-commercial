const CategorieBoutique = require('../models/categorieBoutique.model');

// Lister toutes les catégories (publique)
exports.listerCategories = async (req, res) => {
  try {
    const categories = await CategorieBoutique.find({ est_active: true })
      .sort({ ordre_affichage: 1, nom_categorie: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erreur liste catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Lister toutes les catégories (avec inactives)
exports.listerToutesCategories = async (req, res) => {
  try {
    const categories = await CategorieBoutique.find()
      .sort({ ordre_affichage: 1, nom_categorie: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erreur liste toutes catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Créer une catégorie
exports.creerCategorie = async (req, res) => {
  try {
    const { nom_categorie, description, icone, image_url, ordre_affichage } = req.body;
    
    // Validation
    if (!nom_categorie || nom_categorie.length < 2 || nom_categorie.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la catégorie doit contenir entre 2 et 100 caractères'
      });
    }
    
    // Vérifier si la catégorie existe déjà
    const categorieExistante = await CategorieBoutique.findOne({ 
      nom_categorie: new RegExp(`^${nom_categorie}$`, 'i') 
    });
    
    if (categorieExistante) {
      return res.status(400).json({
        success: false,
        message: 'Cette catégorie existe déjà'
      });
    }
    
    const nouvelleCategorie = new CategorieBoutique({
      nom_categorie,
      description: description || '',
      icone: icone || '🛍️',
      image_url: image_url || '',
      ordre_affichage: ordre_affichage || 0,
      est_active: true
    });
    
    await nouvelleCategorie.save();
    
    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      categorie: nouvelleCategorie
    });
  } catch (error) {
    console.error('Erreur création catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Modifier une catégorie
exports.modifierCategorie = async (req, res) => {
  try {
    const { nom_categorie, description, icone, image_url, ordre_affichage, est_active } = req.body;
    
    const categorie = await CategorieBoutique.findById(req.params.id);
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    // Mettre à jour
    if (nom_categorie && nom_categorie.length >= 2 && nom_categorie.length <= 100) {
      // Vérifier si le nouveau nom existe déjà (sauf pour la même catégorie)
      const categorieExistante = await CategorieBoutique.findOne({ 
        nom_categorie: new RegExp(`^${nom_categorie}$`, 'i'),
        _id: { $ne: categorie._id }
      });
      
      if (categorieExistante) {
        return res.status(400).json({
          success: false,
          message: 'Cette catégorie existe déjà'
        });
      }
      
      categorie.nom_categorie = nom_categorie;
    }
    
    if (description !== undefined) categorie.description = description;
    if (icone !== undefined) categorie.icone = icone;
    if (image_url !== undefined) categorie.image_url = image_url;
    if (ordre_affichage !== undefined) categorie.ordre_affichage = ordre_affichage;
    if (est_active !== undefined) categorie.est_active = est_active;
    
    await categorie.save();
    
    res.status(200).json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      categorie
    });
  } catch (error) {
    console.error('Erreur modification catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la catégorie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Supprimer une catégorie
exports.supprimerCategorie = async (req, res) => {
  try {
    const categorie = await CategorieBoutique.findById(req.params.id);
    
    if (!categorie) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    // Vérifier si des boutiques utilisent cette catégorie
    const Boutique = require('../models/boutique.model');
    const boutiquesAvecCategorie = await Boutique.countDocuments({ categorie: categorie._id });
    
    if (boutiquesAvecCategorie > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car ${boutiquesAvecCategorie} boutique(s) l'utilisent`
      });
    }
    
    await categorie.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir une catégorie par ID
exports.obtenirCategorie = async (req, res) => {
  try {
    const categorie = await CategorieBoutique.findById(req.params.id);
    
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
    console.error('Erreur obtention catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};