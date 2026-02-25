const express = require('express');
const router = express.Router();
const panierController = require('../controllers/panier.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Panier
 *   description: Gestion du panier d'achat (acheteurs seulement)
 */

/**
 * @swagger
 * /panier:
 *   get:
 *     summary: Obtenir le panier de l'utilisateur
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panier récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 panier:
 *                   $ref: '#/components/schemas/Panier'
 *                 total:
 *                   type: number
 *                   description: Total du panier
 *                   example: 59.98
 *                 nombre_articles:
 *                   type: integer
 *                   description: Nombre total d'articles
 *                   example: 2
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.obtenirPanier
);

/**
 * @swagger
 * /panier/nombre-articles:
 *   get:
 *     summary: Obtenir le nombre d'articles dans le panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre d'articles récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 nombre_articles:
 *                   type: integer
 *                   example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/nombre-articles',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.obtenirNombreArticles
);

/**
 * @swagger
 * /panier/ajouter:
 *   post:
 *     summary: Ajouter un produit au panier
 *     tags: [Panier]
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
 *                 description: ID du produit à ajouter
 *                 example: "507f1f77bcf86cd799439014"
 *               quantite:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantité à ajouter
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Produit ajouté au panier avec succès
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
 *                   example: "Produit ajouté au panier avec succès"
 *                 panier:
 *                   $ref: '#/components/schemas/Panier'
 *                 total:
 *                   type: number
 *                   example: 29.99
 *       400:
 *         description: Erreur de validation ou stock insuffisant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Produit non trouvé
 */
router.post('/ajouter',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.ajouterAuPanier
);

/**
 * @swagger
 * /panier/modifier-quantite/{elementId}:
 *   put:
 *     summary: Modifier la quantité d'un produit dans le panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'élément du panier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantite
 *             properties:
 *               quantite:
 *                 type: integer
 *                 minimum: 1
 *                 description: Nouvelle quantité
 *                 example: 3
 *     responses:
 *       200:
 *         description: Quantité mise à jour avec succès
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
 *                   example: "Quantité mise à jour avec succès"
 *                 panier:
 *                   $ref: '#/components/schemas/Panier'
 *                 total:
 *                   type: number
 *                   example: 89.97
 *       400:
 *         description: Quantité invalide ou stock insuffisant
 *       404:
 *         description: Élément du panier non trouvé
 */
router.put('/modifier-quantite/:elementId',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.modifierQuantitePanier
);

/**
 * @swagger
 * /panier/retirer/{elementId}:
 *   delete:
 *     summary: Retirer un produit du panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: elementId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'élément du panier
 *     responses:
 *       200:
 *         description: Produit retiré du panier avec succès
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
 *                   example: "Produit retiré du panier avec succès"
 *                 panier:
 *                   $ref: '#/components/schemas/Panier'
 *                 total:
 *                   type: number
 *                   example: 29.99
 *       404:
 *         description: Élément du panier non trouvé
 */
router.delete('/retirer/:elementId',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.retirerDuPanier
);

/**
 * @swagger
 * /panier/vider:
 *   delete:
 *     summary: Vider complètement le panier
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panier vidé avec succès
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
 *                   example: "Panier vidé avec succès"
 *                 panier:
 *                   $ref: '#/components/schemas/Panier'
 *       404:
 *         description: Panier non trouvé
 */
router.delete('/vider',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.viderPanier
);

/**
 * @swagger
 * /panier/calculer-total:
 *   get:
 *     summary: Calculer le total du panier avec détails par boutique
 *     tags: [Panier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total calculé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total_produits:
 *                   type: number
 *                   description: Total des produits
 *                   example: 89.97
 *                 frais_livraison_total:
 *                   type: number
 *                   description: Total des frais de livraison
 *                   example: 10
 *                 total_general:
 *                   type: number
 *                   description: Total général
 *                   example: 99.97
 *                 detail_par_boutique:
 *                   type: array
 *                   description: Détail par boutique
 *                   items:
 *                     type: object
 *                     properties:
 *                       boutique:
 *                         type: object
 *                         properties:
 *                           nom:
 *                             type: string
 *                           parametres:
 *                             type: object
 *                       total:
 *                         type: number
 *                       frais_livraison:
 *                         type: number
 *                       total_general:
 *                         type: number
 *                 nombre_boutiques:
 *                   type: integer
 *                   example: 2
 */
router.get('/calculer-total',
  authMiddleware,
  roleMiddleware('acheteur'),
  panierController.calculerTotal
);

module.exports = router;