const express = require('express');
const router = express.Router();
const avisController = require('../controllers/avis.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Avis
 *   description: Gestion des avis et commentaires
 */

/**
 * @swagger
 * /api/avis/produit/{id}:
 *   get:
 *     summary: Obtenir les avis d'un produit
 *     description: Récupère tous les avis d'un produit spécifique
 *     tags: [Avis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Numéro de page
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'avis par page
 *         default: 10
 *       - in: query
 *         name: note
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrer par note spécifique
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [recent, ancien, note_desc, note_asc, utile]
 *         description: Critère de tri
 *         default: recent
 *     responses:
 *       200:
 *         description: Liste des avis récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avis:
 *                   $ref: '#/components/schemas/PaginatedResponse'
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalAvis:
 *                       type: integer
 *                       example: 25
 *                     moyenneNotes:
 *                       type: string
 *                       example: "4.2"
 *                     repartition:
 *                       type: object
 *                       properties:
 *                         "1":
 *                           type: integer
 *                           example: 2
 *                         "2":
 *                           type: integer
 *                           example: 1
 *                         "3":
 *                           type: integer
 *                           example: 3
 *                         "4":
 *                           type: integer
 *                           example: 8
 *                         "5":
 *                           type: integer
 *                           example: 11
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/produit/:id', avisController.obtenirAvisProduit);

/**
 * @swagger
 * /api/avis/boutique/{id}:
 *   get:
 *     summary: Obtenir les avis d'une boutique
 *     description: Récupère tous les avis d'une boutique spécifique
 *     tags: [Avis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Numéro de page
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre d'avis par page
 *         default: 10
 *       - in: query
 *         name: note
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrer par note spécifique
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [recent, ancien, note_desc, note_asc]
 *         description: Critère de tri
 *         default: recent
 *     responses:
 *       200:
 *         description: Liste des avis récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avis:
 *                   $ref: '#/components/schemas/PaginatedResponse'
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalAvis:
 *                       type: integer
 *                       example: 15
 *                     moyenneNotes:
 *                       type: string
 *                       example: "4.5"
 *                     statsNotes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: integer
 *                             example: 5
 *                           count:
 *                             type: integer
 *                             example: 10
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/boutique/:id', avisController.obtenirAvisBoutique);

/**
 * @swagger
 * /api/avis/produit:
 *   post:
 *     summary: Ajouter un avis sur un produit
 *     description: Ajoute un avis et une note pour un produit acheté
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - produitId
 *               - note
 *             properties:
 *               produitId:
 *                 type: string
 *                 description: ID du produit
 *                 example: "507f1f77bcf86cd799439014"
 *               note:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Note sur 5 étoiles
 *                 example: 5
 *               commentaire:
 *                 type: string
 *                 description: Commentaire textuel
 *                 example: "Produit excellent, je recommande !"
 *               commandeId:
 *                 type: string
 *                 description: ID de la commande (pour vérification d'achat)
 *                 example: "507f1f77bcf86cd799439015"
 *     responses:
 *       201:
 *         description: Avis ajouté avec succès
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
 *                   example: "Avis ajouté avec succès"
 *                 avis:
 *                   $ref: '#/components/schemas/Avis'
 *       400:
 *         description: Données invalides ou avis déjà existant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: L'utilisateur n'a pas acheté ce produit
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/produit',
  authMiddleware,
  roleMiddleware('acheteur'),
  avisController.ajouterAvisProduit
);

/**
 * @swagger
 * /api/avis/boutique:
 *   post:
 *     summary: Ajouter un avis sur une boutique
 *     description: Ajoute un avis et une note pour une boutique
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - boutiqueId
 *               - note
 *             properties:
 *               boutiqueId:
 *                 type: string
 *                 description: ID de la boutique
 *                 example: "507f1f77bcf86cd799439012"
 *               note:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Note sur 5 étoiles
 *                 example: 4
 *               commentaire:
 *                 type: string
 *                 description: Commentaire textuel
 *                 example: "Boutique sérieuse, livraison rapide."
 *     responses:
 *       201:
 *         description: Avis ajouté avec succès
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
 *                   example: "Avis ajouté avec succès"
 *                 avis:
 *                   $ref: '#/components/schemas/Avis'
 *       400:
 *         description: Données invalides ou avis déjà existant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: L'utilisateur n'a pas commandé dans cette boutique
 */
router.post('/boutique',
  authMiddleware,
  roleMiddleware('acheteur'),
  avisController.ajouterAvisBoutique
);

/**
 * @swagger
 * /api/avis/{id}/repondre:
 *   post:
 *     summary: Répondre à un avis (gérants seulement)
 *     description: Permet à un gérant de boutique de répondre à un avis
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reponse
 *             properties:
 *               reponse:
 *                 type: string
 *                 description: Réponse à l'avis
 *                 example: "Merci pour votre retour ! Nous sommes ravis que vous ayez aimé notre produit."
 *     responses:
 *       200:
 *         description: Réponse ajoutée avec succès
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
 *                   example: "Réponse ajoutée avec succès"
 *                 avis:
 *                   $ref: '#/components/schemas/Avis'
 *       400:
 *         description: Réponse vide ou invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Vous n'êtes pas autorisé à répondre à cet avis
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/repondre',
  authMiddleware,
  roleMiddleware('boutique'),
  avisController.repondreAvis
);

/**
 * @swagger
 * /api/avis/{id}/signaler:
 *   post:
 *     summary: Signaler un avis
 *     description: Signale un avis inapproprié ou abusif
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - raison
 *             properties:
 *               raison:
 *                 type: string
 *                 description: Raison du signalement
 *                 example: "Commentaire inapproprié"
 *     responses:
 *       200:
 *         description: Avis signalé avec succès
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
 *                   example: "Avis signalé avec succès"
 *                 nombreSignalements:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Raison manquante ou avis déjà signalé
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/signaler',
  authMiddleware,
  avisController.signalerAvis
);

/**
 * @swagger
 * /api/avis/{id}/aimer:
 *   post:
 *     summary: Aimer un avis
 *     description: Ajoute ou retire un like sur un avis
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis
 *     responses:
 *       200:
 *         description: Action réalisée avec succès
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
 *                   example: "Avis aimé"
 *                 nombreLikes:
 *                   type: integer
 *                   example: 5
 *                 aime:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/aimer',
  authMiddleware,
  avisController.aimerAvis
);

/**
 * @swagger
 * /api/avis/{id}/moderer:
 *   put:
 *     summary: Modérer un avis (admin seulement)
 *     description: Valide ou invalide un avis (modération)
 *     tags: [Avis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - est_valide
 *             properties:
 *               est_valide:
 *                 type: boolean
 *                 description: Nouveau statut de validation
 *                 example: true
 *     responses:
 *       200:
 *         description: Avis modéré avec succès
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
 *                   example: "Avis validé avec succès"
 *                 avis:
 *                   $ref: '#/components/schemas/Avis'
 *       400:
 *         description: Statut de validation manquant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id/moderer',
  authMiddleware,
  roleMiddleware('admin_centre'),
  avisController.modererAvis
);

module.exports = router;