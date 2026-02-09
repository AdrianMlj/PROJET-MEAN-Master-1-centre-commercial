const express = require('express');
const router = express.Router();
const categorieProduitController = require('../controllers/categorieProduit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * /api/categories-produit:
 *   get:
 *     summary: Lister les catégories de produits de sa boutique
 *     description: Retourne toutes les catégories de produits créées par le gérant de boutique authentifié
 *     tags: [Catégories Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page pour la pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des catégories de produits
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès réservé aux gérants de boutique
 *       500:
 *         description: Erreur serveur
 */
router.get('/',
  authMiddleware,
  roleMiddleware('boutique'),
  categorieProduitController.listerCategoriesBoutique
);

/**
 * @swagger
 * /api/categories-produit:
 *   post:
 *     summary: Créer une catégorie de produits
 *     description: Crée une nouvelle catégorie de produits pour la boutique du gérant authentifié
 *     tags: [Catégories Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom_categorie
 *             properties:
 *               nom_categorie:
 *                 type: string
 *                 description: Nom de la catégorie
 *                 example: "T-shirts"
 *               description:
 *                 type: string
 *                 description: Description de la catégorie
 *                 example: "Tous nos t-shirts en coton"
 *               image_url:
 *                 type: string
 *                 description: URL de l'image de la catégorie
 *               ordre_affichage:
 *                 type: integer
 *                 description: Ordre d'affichage
 *                 default: 0
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
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
 *                   example: "Catégorie de produits créée avec succès"
 *                 categorie:
 *                   $ref: '#/components/schemas/CategorieProduit'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès réservé aux gérants de boutique
 *       500:
 *         description: Erreur serveur
 */
router.post('/',
  authMiddleware,
  roleMiddleware('boutique'),
  categorieProduitController.creerCategorieProduit
);

/**
 * @swagger
 * /api/categories-produit/{id}:
 *   get:
 *     summary: Obtenir une catégorie de produits
 *     description: Récupère les détails d'une catégorie de produits spécifique
 *     tags: [Catégories Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie produit
 *     responses:
 *       200:
 *         description: Détails de la catégorie produit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 categorie:
 *                   $ref: '#/components/schemas/CategorieProduit'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès réservé aux gérants de boutique
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  categorieProduitController.obtenirCategorieProduit
);

/**
 * @swagger
 * /api/categories-produit/{id}:
 *   put:
 *     summary: Modifier une catégorie de produits
 *     description: Met à jour les informations d'une catégorie de produits existante
 *     tags: [Catégories Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom_categorie:
 *                 type: string
 *                 description: Nouveau nom de la catégorie
 *               description:
 *                 type: string
 *                 description: Nouvelle description
 *               image_url:
 *                 type: string
 *                 description: Nouvelle URL d'image
 *               ordre_affichage:
 *                 type: integer
 *                 description: Nouvel ordre d'affichage
 *               est_active:
 *                 type: boolean
 *                 description: Statut d'activation
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
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
 *                   example: "Catégorie de produits mise à jour avec succès"
 *                 categorie:
 *                   $ref: '#/components/schemas/CategorieProduit'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès réservé aux gérants de boutique
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  categorieProduitController.modifierCategorieProduit
);

/**
 * @swagger
 * /api/categories-produit/{id}:
 *   delete:
 *     summary: Supprimer une catégorie de produits
 *     description: Supprime une catégorie de produits (si aucun produit n'y est associé)
 *     tags: [Catégories Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie produit
 *     responses:
 *       200:
 *         description: Catégorie supprimée avec succès
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
 *                   example: "Catégorie de produits supprimée avec succès"
 *       400:
 *         description: Impossible de supprimer car des produits utilisent cette catégorie
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Accès réservé aux gérants de boutique
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  categorieProduitController.supprimerCategorieProduit
);

module.exports = router;