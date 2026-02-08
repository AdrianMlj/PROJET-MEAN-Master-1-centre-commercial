const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Routes admin seulement
router.get('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.listerUtilisateurs
);

router.post('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.creerUtilisateur
);

router.get('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.obtenirUtilisateur
);

router.put('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.modifierUtilisateur
);

router.delete('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.supprimerUtilisateur
);

router.post('/:id/reinitialiser-mot-de-passe', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.reinitialiserMotDePasse
);

module.exports = router;