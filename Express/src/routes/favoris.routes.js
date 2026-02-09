const express = require('express');
const router = express.Router();
const favorisController = require('../controllers/favoris.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Favoris
 *   description: Gestion des produits et boutiques favoris (acheteurs seulement)
 */

/**
 * @swagger
 * /api/favoris:
 *   get:
 *     summary: Obtenir tous les favoris de l'utilisateur connecté
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des favoris récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 produits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Produit'
 *                 boutiques:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Boutique'
 *                 total:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.obtenirFavoris
);

/**
 * @swagger
 * /api/favoris/produit:
 *   post:
 *     summary: Ajouter un produit aux favoris
 *     tags: [Favoris]
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
 *             properties:
 *               produitId:
 *                 type: string
 *                 description: ID du produit à ajouter aux favoris
 *                 example: "507f1f77bcf86cd799439014"
 *     responses:
 *       201:
 *         description: Produit ajouté aux favoris avec succès
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
 *                   example: "Produit ajouté aux favoris"
 *                 favori:
 *                   $ref: '#/components/schemas/Favoris'
 *       400:
 *         description: Produit déjà dans les favoris ou données invalides
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/produit',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.ajouterProduitFavori
);

/**
 * @swagger
 * /api/favoris/boutique:
 *   post:
 *     summary: Ajouter une boutique aux favoris
 *     tags: [Favoris]
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
 *             properties:
 *               boutiqueId:
 *                 type: string
 *                 description: ID de la boutique à ajouter aux favoris
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Boutique ajoutée aux favoris avec succès
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
 *                   example: "Boutique ajoutée aux favoris"
 *                 favori:
 *                   $ref: '#/components/schemas/Favoris'
 *       400:
 *         description: Boutique déjà dans les favoris ou données invalides
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/boutique',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.ajouterBoutiqueFavori
);

/**
 * @swagger
 * /api/favoris/produit/{produitId}/verifier:
 *   get:
 *     summary: Vérifier si un produit est dans les favoris
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: produitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit à vérifier
 *     responses:
 *       200:
 *         description: Statut vérifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 est_favori:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/produit/:produitId/verifier',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.verifierProduitFavori
);

/**
 * @swagger
 * /api/favoris/boutique/{boutiqueId}/verifier:
 *   get:
 *     summary: Vérifier si une boutique est dans les favoris
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boutiqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique à vérifier
 *     responses:
 *       200:
 *         description: Statut vérifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 est_favori:
 *                   type: boolean
 *                   example: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/boutique/:boutiqueId/verifier',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.verifierBoutiqueFavori
);

/**
 * @swagger
 * /api/favoris/produit/{produitId}:
 *   delete:
 *     summary: Retirer un produit des favoris
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: produitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit à retirer des favoris
 *     responses:
 *       200:
 *         description: Produit retiré des favoris avec succès
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
 *                   example: "Produit retiré des favoris"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Produit non trouvé dans les favoris
 */
router.delete('/produit/:produitId',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.retirerProduitFavori
);

/**
 * @swagger
 * /api/favoris/boutique/{boutiqueId}:
 *   delete:
 *     summary: Retirer une boutique des favoris
 *     tags: [Favoris]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boutiqueId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique à retirer des favoris
 *     responses:
 *       200:
 *         description: Boutique retirée des favoris avec succès
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
 *                   example: "Boutique retirée des favoris"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée dans les favoris
 */
router.delete('/boutique/:boutiqueId',
  authMiddleware,
  roleMiddleware('acheteur'),
  favorisController.retirerBoutiqueFavori
);

module.exports = router;