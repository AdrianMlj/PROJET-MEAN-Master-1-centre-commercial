const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes publiques
router.get('/', boutiqueController.listerBoutiques);
router.get('/:id', boutiqueController.obtenirBoutique);
router.get('/:id/produits', boutiqueController.obtenirProduitsBoutique);

// Routes protégées
router.get('/gerant/mon-profil',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.gererProfilBoutique
);

router.put('/gerant/mon-profil',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.gererProfilBoutique
);

// Routes admin seulement
router.post('/',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.creerBoutique
);

router.put('/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.modifierBoutique
);

router.put('/:id/toggle-activation',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.toggleActivationBoutique
);

module.exports = router;