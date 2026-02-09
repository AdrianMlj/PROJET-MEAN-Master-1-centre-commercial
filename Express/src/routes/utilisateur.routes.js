const express = require('express');
const router = express.Router();
const utilisateurController = require('../controllers/utilisateur.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Gestion des utilisateurs (admin seulement)
 */

/**
 * @swagger
 * /utilisateurs:
 *   get:
 *     summary: Lister tous les utilisateurs
 *     tags: [Utilisateurs]
 *     description: Récupère la liste paginée de tous les utilisateurs avec filtres
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin_centre, boutique, acheteur]
 *         description: Filtrer par rôle
 *       - in: query
 *         name: est_actif
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut d'activation
 *       - in: query
 *         name: recherche
 *         schema:
 *           type: string
 *         description: Rechercher par nom, prénom ou email
 *     responses:
 *       200:
 *         description: Liste paginée des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     docs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Utilisateur'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.listerUtilisateurs
);

/**
 * @swagger
 * /utilisateurs/statistiques:
 *   get:
 *     summary: Statistiques des utilisateurs
 *     tags: [Utilisateurs]
 *     description: Récupère les statistiques globales sur les utilisateurs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     total_utilisateurs:
 *                       type: integer
 *                       example: 150
 *                     acheteurs:
 *                       type: integer
 *                       example: 120
 *                     boutiques:
 *                       type: integer
 *                       example: 25
 *                     admins:
 *                       type: integer
 *                       example: 5
 *                     utilisateurs_actifs:
 *                       type: integer
 *                       example: 140
 *                     nouveaux_mois:
 *                       type: integer
 *                       example: 15
 *                     pourcentage_actifs:
 *                       type: string
 *                       example: "93.33"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/statistiques', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.statistiquesUtilisateurs
);

/**
 * @swagger
 * /utilisateurs:
 *   post:
 *     summary: Créer un nouvel utilisateur
 *     tags: [Utilisateurs]
 *     description: Crée un nouveau compte utilisateur (admin seulement)
 *     security:
 *       - bearerAuth: []
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
 *                 example: "nouveau@example.com"
 *               mot_de_passe:
 *                 type: string
 *                 minLength: 6
 *                 example: "motdepasse123"
 *               nom:
 *                 type: string
 *                 example: "Martin"
 *               prenom:
 *                 type: string
 *                 example: "Sophie"
 *               telephone:
 *                 type: string
 *                 example: "+33698765432"
 *               role:
 *                 type: string
 *                 enum: [admin_centre, boutique, acheteur]
 *                 example: "acheteur"
 *               est_actif:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
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
 *                   example: Utilisateur créé avec succès
 *                 utilisateur:
 *                   $ref: '#/components/schemas/Utilisateur'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         description: Email déjà utilisé
 */
router.post('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.creerUtilisateur
);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID
 *     tags: [Utilisateurs]
 *     description: Récupère les détails d'un utilisateur spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.obtenirUtilisateur
);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   put:
 *     summary: Modifier un utilisateur
 *     tags: [Utilisateurs]
 *     description: Met à jour les informations d'un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 example: "Durand"
 *               prenom:
 *                 type: string
 *                 example: "Pierre"
 *               telephone:
 *                 type: string
 *                 example: "+33612345678"
 *               est_actif:
 *                 type: boolean
 *                 example: true
 *               boutique_associee:
 *                 type: string
 *                 description: ID de la boutique à associer (ou null pour dissocier)
 *                 example: null
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
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
 *                   example: Utilisateur mis à jour avec succès
 *                 utilisateur:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     prenom:
 *                       type: string
 *                     telephone:
 *                       type: string
 *                     est_actif:
 *                       type: boolean
 *                     boutique_associee:
 *                       type: string
 *       400:
 *         description: Données invalides ou boutique non trouvée
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.modifierUtilisateur
);

/**
 * @swagger
 * /utilisateurs/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     tags: [Utilisateurs]
 *     description: Supprime un utilisateur (ne peut pas supprimer un gérant de boutique)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
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
 *                   example: Utilisateur supprimé avec succès
 *       400:
 *         description: Impossible de supprimer un gérant de boutique
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.supprimerUtilisateur
);

/**
 * @swagger
 * /utilisateurs/{id}/reinitialiser-mot-de-passe:
 *   post:
 *     summary: Réinitialiser le mot de passe d'un utilisateur
 *     tags: [Utilisateurs]
 *     description: Réinitialise le mot de passe d'un utilisateur (admin seulement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nouveau_mot_de_passe
 *             properties:
 *               nouveau_mot_de_passe:
 *                 type: string
 *                 minLength: 6
 *                 description: Nouveau mot de passe
 *                 example: "NouveauMotDePasse123"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
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
 *                   example: Mot de passe réinitialisé avec succès
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.post('/:id/reinitialiser-mot-de-passe', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.reinitialiserMotDePasse
);

/**
 * @swagger
 * /utilisateurs/{id}/toggle-activation:
 *   put:
 *     summary: Activer/désactiver un utilisateur
 *     tags: [Utilisateurs]
 *     description: Bascule l'état d'activation d'un utilisateur
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Statut d'activation modifié
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
 *                   example: Utilisateur désactivé avec succès
 *                 est_actif:
 *                   type: boolean
 *                   example: false
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Utilisateur non trouvé
 */
router.put('/:id/toggle-activation', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  utilisateurController.toggleActivationUtilisateur
);

module.exports = router;