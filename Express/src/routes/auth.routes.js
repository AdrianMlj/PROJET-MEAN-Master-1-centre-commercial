const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Routes publiques
router.post('/inscription', authController.inscription);
router.post('/connexion', authController.connexion);

// Routes protégées
router.get('/profil', authMiddleware, authController.profil);
router.put('/profil', authMiddleware, authController.modifierProfil);
router.put('/changer-mot-de-passe', authMiddleware, authController.changerMotDePasse);

module.exports = router;