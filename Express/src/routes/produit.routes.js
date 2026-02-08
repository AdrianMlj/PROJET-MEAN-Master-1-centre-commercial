const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes publiques
router.get('/', produitController.listerProduits);
router.get('/:id', produitController.obtenirProduit);

// Routes pour les boutiques
router.post('/',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.creerProduit
);

router.put('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.modifierProduit
);

router.delete('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.supprimerProduit
);

router.put('/:id/stock',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.gererStock
);

module.exports = router;