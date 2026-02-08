const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commande.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes pour les acheteurs
router.post('/',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.passerCommande
);

router.get('/mes-commandes',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.obtenirCommandesClient
);

router.get('/:id',
  authMiddleware,
  commandeController.obtenirDetailCommande
);

router.get('/:id/historique',
  authMiddleware,
  commandeController.obtenirHistoriqueStatuts
);

router.put('/:id/annuler',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.annulerCommande
);

// Routes pour les boutiques
router.get('/boutique/mes-commandes',
  authMiddleware,
  roleMiddleware('boutique'),
  commandeController.obtenirCommandesBoutique
);

router.put('/:id/statut',
  authMiddleware,
  roleMiddleware('boutique'),
  commandeController.mettreAJourStatutCommande
);

module.exports = router;