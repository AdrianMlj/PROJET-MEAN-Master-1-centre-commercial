const express = require('express');
const router = express.Router();
const statistiquesController = require('../controllers/statistiques.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Statistiques globales (admin seulement)
router.get('/globales',
  authMiddleware,
  roleMiddleware('admin_centre'),
  statistiquesController.statistiquesGlobales
);

// Statistiques de la boutique (gérants seulement)
router.get('/boutique',
  authMiddleware,
  roleMiddleware('boutique'),
  statistiquesController.statistiquesBoutique
);

router.get('/boutique/produits',
  authMiddleware,
  roleMiddleware('boutique'),
  statistiquesController.statistiquesProduitsBoutique
);

module.exports = router;