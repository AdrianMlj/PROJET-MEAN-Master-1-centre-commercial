const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadAvatar, handleUploadError } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Gestion de l'authentification et des comptes utilisateurs
 */

/**
 * @swagger
 * /auth/inscription:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Authentification]
 *     description: Crée un nouveau compte utilisateur avec le rôle spécifié
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - mot_de_passe
 *               - nom
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: utilisateur@example.com
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               telephone:
 *                 type: string
 *                 example: "+33612345678"
 *               role:
 *                 type: string
 *                 enum: [admin_centre, boutique, acheteur]
 *                 description: Rôle de l'utilisateur
 *               adresse:
 *                 type: object
 *                 properties:
 *                   rue:
 *                     type: string
 *                   ville:
 *                     type: string
 *                   code_postal:
 *                     type: string
 *                   pays:
 *                     type: string
 *                     default: France
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Inscription réussie
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 utilisateur:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Un utilisateur avec cet email existe déjà
 *       500:
 *         description: Erreur serveur
 */
router.post('/inscription', authController.inscription);

/**
 * @swagger
 * /auth/connexion:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Authentification]
 *     description: Authentifie un utilisateur et retourne un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - mot_de_passe
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@commerce.com
 *               mot_de_passe:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Connexion réussie
 *                 token:
 *                   type: string
 *                   description: Token JWT pour l'authentification
 *                 utilisateur:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Email ou mot de passe incorrect
 *       403:
 *         description: Compte désactivé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: Compte désactivé. Contactez l'administrateur.
 */
router.post('/connexion', authController.connexion);

/**
 * @swagger
 * /auth/deconnexion:
 *   post:
 *     summary: Déconnexion
 *     tags: [Authentification]
 *     description: Déconnecte l'utilisateur (invalide le token côté client)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/deconnexion', authController.deconnexion);

/**
 * @swagger
 * /auth/profil:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Authentification]
 *     description: Récupère les informations du profil de l'utilisateur authentifié
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 utilisateur:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/profil', authMiddleware, authController.profil);

/**
 * @swagger
 * /auth/profil:
 *   put:
 *     summary: Modifier le profil utilisateur
 *     tags: [Authentification]
 *     description: Met à jour les informations du profil de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               telephone:
 *                 type: string
 *                 example: "+33612345678"
 *               adresse:
 *                 type: object
 *                 properties:
 *                   rue:
 *                     type: string
 *                     example: "123 Rue de Paris"
 *                   ville:
 *                     type: string
 *                     example: "Paris"
 *                   code_postal:
 *                     type: string
 *                     example: "75000"
 *                   pays:
 *                     type: string
 *                     example: "France"
 *               preferences:
 *                 type: object
 *                 properties:
 *                   newsletter:
 *                     type: boolean
 *                     example: true
 *                   notifications:
 *                     type: boolean
 *                     example: true
 *                   langue:
 *                     type: string
 *                     enum: [fr, en, es]
 *                     example: fr
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profil mis à jour avec succès
 *                 utilisateur:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profil', authMiddleware, authController.modifierProfil);

/**
 * @swagger
 * /auth/changer-mot-de-passe:
 *   put:
 *     summary: Changer le mot de passe
 *     tags: [Authentification]
 *     description: Permet à l'utilisateur connecté de changer son mot de passe
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ancien_mot_de_passe
 *               - nouveau_mot_de_passe
 *             properties:
 *               ancien_mot_de_passe:
 *                 type: string
 *                 description: Mot de passe actuel
 *                 example: "ancien123"
 *               nouveau_mot_de_passe:
 *                 type: string
 *                 description: Nouveau mot de passe (min 6 caractères)
 *                 minLength: 6
 *                 example: "nouveau456"
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Mot de passe modifié avec succès
 *       400:
 *         description: Erreur de validation ou ancien mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/changer-mot-de-passe', authMiddleware, authController.changerMotDePasse);

/**
 * @swagger
 * /auth/avatar:
 *   post:
 *     summary: Uploader un avatar
 *     tags: [Authentification]
 *     description: Télécharge une image d'avatar pour l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image (jpeg, jpg, png, gif, webp) - Max 5MB
 *     responses:
 *       200:
 *         description: Avatar uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar uploadé avec succès
 *                 avatar_url:
 *                   type: string
 *                   format: uri
 *                   example: /uploads/avatars/avatar-123456789.jpg
 *       400:
 *         description: Fichier invalide ou trop volumineux
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/avatar', 
  authMiddleware, 
  uploadAvatar, 
  handleUploadError, 
  authController.uploadAvatar
);

/**
 * @swagger
 * /auth/avatar:
 *   put:
 *     tags: [Auth]
 *     summary: Mettre à jour l'avatar de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar mis à jour
 *       400:
 *         description: Aucun fichier
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/avatar',
  authMiddleware,
  uploadAvatar,          // Middleware d'upload (avatar)
  handleUploadError,
  authController.updateAvatar
);

/**
 * @swagger
 * /auth/avatar:
 *   put:
 *     tags: [Auth]
 *     summary: Mettre à jour l'avatar de l'utilisateur connecté
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar mis à jour
 *       400:
 *         description: Aucun fichier
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/avatar',
  authMiddleware,
  uploadAvatar,          // Middleware d'upload (avatar)
  handleUploadError,
  authController.updateAvatar
);
module.exports = router;