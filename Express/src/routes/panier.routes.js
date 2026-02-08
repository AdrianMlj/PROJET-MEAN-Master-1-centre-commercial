const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panier.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes protégées (acheteurs seulement)
router.get('/',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.obtenirPanier
);

router.post('/ajouter',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.ajouterAuPanier
);

router.put('/modifier-quantite/:elementId',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.modifierQuantitePanier
);

router.delete('/retirer/:elementId',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.retirerDuPanier
);

router.delete('/vider',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.viderPanier
);

router.get('/calculer-total',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.calculerTotal
);

module.exports = router;