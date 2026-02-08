const express = require('express');
const router = express.Router();
const CategorieBoutique = require('../models/categorieBoutique.model');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Obtenir toutes les catégories (publique)
router.get('/', async (req, res) => {
  try {
    const categories = await CategorieBoutique.find({ est_active: true })
      .sort({ ordre_affichage: 1 });
    
    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories',
      error: error.message
    });
  }
});

// Créer une catégorie (admin seulement)
router.post('/',
  authMiddleware,
  roleMiddleware('admin_centre'),
  async (req, res) => {
    try {
      const { nom_categorie, description, icone, image_url } = req.body;
      
      const nouvelleCategorie = new CategorieBoutique({
        nom_categorie,
        description,
        icone: icone || '🛍️',
        image_url
      });
      
      await nouvelleCategorie.save();
      
      res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        categorie: nouvelleCategorie
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la catégorie',
        error: error.message
      });
    }
  }
);

module.exports = router;