const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadMultipleImages, handleUploadError } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * /produits:
 *   get:
 *     summary: Lister les produits
 *     description: Retourne la liste des produits avec filtres et pagination (publique)
 *     tags: [Produits]
 *     parameters:
 *       - in: query
 *         name: boutique
 *         schema:
 *           type: string
 *         description: Filtrer par boutique spécifique
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie produit
 *       - in: query
 *         name: min_prix
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix minimum
 *       - in: query
 *         name: max_prix
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix maximum
 *       - in: query
 *         name: en_promotion
 *         schema:
 *           type: boolean
 *         description: Filtrer les produits en promotion
 *       - in: query
 *         name: recherche
 *         schema:
 *           type: string
 *         description: Recherche par nom, description ou tags
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Tags séparés par des virgules
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite par page
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [prix_asc, prix_desc, nouveautes, ventes, note, promotion]
 *           default: nouveautes
 *         description: Critère de tri
 *     responses:
 *       200:
 *         description: Liste paginée des produits
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', produitController.listerProduits);

/**
 * @swagger
 * /produits/{id}:
 *   get:
 *     summary: Obtenir un produit
 *     description: Récupère les détails complets d'un produit spécifique
 *     tags: [Produits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Détails du produit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 produit:
 *                   $ref: '#/components/schemas/Produit'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', produitController.obtenirProduit);

/**
 * @swagger
 * /produits/gerant/mes-produits:
 *   get:
 *     summary: Obtenir les produits de sa boutique
 *     description: Retourne tous les produits de la boutique du gérant authentifié
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: est_actif
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut d'activation
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie produit
 *       - in: query
 *         name: en_promotion
 *         schema:
 *           type: boolean
 *         description: Filtrer les produits en promotion
 *       - in: query
 *         name: faible_stock
 *         schema:
 *           type: boolean
 *         description: Filtrer les produits avec faible stock
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite par page
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [prix_asc, prix_desc, nouveautes, ventes, stock_asc, stock_desc]
 *           default: nouveautes
 *         description: Critère de tri
 *     responses:
 *       200:
 *         description: Liste des produits de la boutique
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
router.get('/gerant/mes-produits',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.obtenirProduitsBoutiqueGérant
);

/**
 * @swagger
 * /produits:
 *   post:
 *     summary: Créer un produit
 *     description: Crée un nouveau produit pour la boutique du gérant authentifié
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prix
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom du produit
 *                 example: "T-shirt en coton bio"
 *               description:
 *                 type: string
 *                 description: Description courte
 *               description_detaillee:
 *                 type: string
 *                 description: Description détaillée
 *               prix:
 *                 type: number
 *                 minimum: 0
 *                 description: Prix du produit
 *                 example: 29.99
 *               quantite_stock:
 *                 type: integer
 *                 minimum: 0
 *                 description: Quantité initiale en stock
 *                 default: 0
 *               categorie_produit:
 *                 type: string
 *                 description: ID de la catégorie produit
 *               caracteristiques:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nom:
 *                       type: string
 *                     valeur:
 *                       type: string
 *                     unite:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tags pour la recherche
 *               seuil_alerte:
 *                 type: integer
 *                 minimum: 0
 *                 description: Seuil d'alerte pour le stock faible
 *                 default: 5
 *               poids:
 *                 type: number
 *                 minimum: 0
 *                 description: Poids en grammes
 *               dimensions:
 *                 type: object
 *                 properties:
 *                   longueur:
 *                     type: number
 *                     minimum: 0
 *                   largeur:
 *                     type: number
 *                     minimum: 0
 *                   hauteur:
 *                     type: number
 *                     minimum: 0
 *     responses:
 *       201:
 *         description: Produit créé avec succès
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
 *                   example: "Produit créé avec succès"
 *                 produit:
 *                   $ref: '#/components/schemas/Produit'
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
  produitController.creerProduit
);

/**
 * @swagger
 * /produits/{id}:
 *   put:
 *     summary: Modifier un produit
 *     description: Met à jour les informations d'un produit existant
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nouveau nom
 *               description:
 *                 type: string
 *                 description: Nouvelle description
 *               description_detaillee:
 *                 type: string
 *               prix:
 *                 type: number
 *                 minimum: 0
 *               quantite_stock:
 *                 type: integer
 *                 minimum: 0
 *               categorie_produit:
 *                 type: string
 *               est_actif:
 *                 type: boolean
 *               en_promotion:
 *                 type: boolean
 *               prix_promotion:
 *                 type: number
 *                 minimum: 0
 *               date_fin_promotion:
 *                 type: string
 *                 format: date-time
 *               caracteristiques:
 *                 type: array
 *                 items:
 *                   type: object
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               seuil_alerte:
 *                 type: integer
 *                 minimum: 0
 *               poids:
 *                 type: number
 *                 minimum: 0
 *               dimensions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Produit mis à jour avec succès
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
 *                   example: "Produit mis à jour avec succès"
 *                 produit:
 *                   $ref: '#/components/schemas/Produit'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Vous n'êtes pas autorisé à modifier ce produit
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.modifierProduit
);

/**
 * @swagger
 * /produits/{id}:
 *   delete:
 *     summary: Supprimer un produit
 *     description: Désactive un produit (soft delete)
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Produit désactivé avec succès
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
 *                   example: "Produit désactivé avec succès"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Vous n'êtes pas autorisé à supprimer ce produit
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.supprimerProduit
);

/**
 * @swagger
 * /produits/{id}/stock:
 *   put:
 *     summary: Gérer le stock d'un produit
 *     description: Ajoute, retire ou définit la quantité en stock d'un produit
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - quantite
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [ajouter, retirer, definir]
 *                 description: Type d'opération
 *               quantite:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantité à appliquer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Stock mis à jour avec succès
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
 *                   example: "Stock mis à jour avec succès"
 *                 nouveau_stock:
 *                   type: integer
 *                   description: Nouvelle quantité en stock
 *                   example: 50
 *       400:
 *         description: Stock insuffisant ou opération invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Vous n'êtes pas autorisé à gérer le stock de ce produit
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id/stock',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.gererStock
);

/**
 * @swagger
 * /produits/{id}/images:
 *   post:
 *     tags: [Produits]
 *     summary: Uploader plusieurs images pour un produit
 *     description: Permet au gérant d'ajouter plusieurs photos à un produit (max 5)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploadées avec succès
 *       400:
 *         description: Erreur
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/:id/images',
  authMiddleware,
  roleMiddleware('boutique'),
  uploadMultipleImages, // Middleware pour plusieurs fichiers (champ "images")
  handleUploadError,
  produitController.uploadImagesProduit
);

/**
 * @swagger
 * /produits/{produitId}/images/{imageId}:
 *   delete:
 *     summary: Supprimer une image d'un produit
 *     description: Supprime une image spécifique d'un produit
 *     tags: [Produits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: produitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'image
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
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
 *                   example: "Image supprimée avec succès"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Vous n'êtes pas autorisé à modifier ce produit
 *       404:
 *         description: Produit ou image non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:produitId/images/:imageId',
  authMiddleware,
  roleMiddleware('boutique'),
  produitController.supprimerImageProduit
);

module.exports = router;

/**
 * @swagger
 * /produits/{id}/toggle-activation:
 *   patch:
 *     tags: [Produits]
 *     summary: Activer/désactiver un produit
 *     description: Permet au gérant de la boutique d'activer ou désactiver un produit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     responses:
 *       200:
 *         description: Statut modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 produit:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     est_actif:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch('/:id/toggle-activation',
  authMiddleware,
  roleMiddleware('boutique'), // Seulement le gérant de la boutique (ou admin si vous voulez)
  produitController.toggleActivationProduit
);