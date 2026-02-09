const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadBoutiqueLogo, handleUploadError } = require('../middlewares/upload.middleware');

/**
 * @swagger
 * /boutiques:
 *   get:
 *     tags: [Boutiques]
 *     summary: Lister toutes les boutiques
 *     description: Récupère la liste des boutiques avec filtres et pagination
 *     parameters:
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
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie ID
 *       - in: query
 *         name: est_active
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut d'activation
 *       - in: query
 *         name: recherche
 *         schema:
 *           type: string
 *         description: Rechercher par nom ou description
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [nouveautes, nom_asc, nom_desc, ventes, chiffre_affaires]
 *           default: nouveautes
 *         description: Critère de tri
 *     responses:
 *       200:
 *         description: Liste des boutiques récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', boutiqueController.listerBoutiques);

/**
 * @swagger
 * /boutiques/{id}:
 *   get:
 *     tags: [Boutiques]
 *     summary: Obtenir une boutique par ID
 *     description: Récupère les détails d'une boutique spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *     responses:
 *       200:
 *         description: Détails de la boutique
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', boutiqueController.obtenirBoutique);

/**
 * @swagger
 * /boutiques/{id}/produits:
 *   get:
 *     tags: [Boutiques]
 *     summary: Obtenir les produits d'une boutique
 *     description: Récupère la liste des produits d'une boutique avec filtres
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
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
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
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [prix_asc, prix_desc, nouveautes, ventes, note]
 *           default: nouveautes
 *         description: Critère de tri
 *       - in: query
 *         name: min_prix
 *         schema:
 *           type: number
 *         description: Prix minimum
 *       - in: query
 *         name: max_prix
 *         schema:
 *           type: number
 *         description: Prix maximum
 *     responses:
 *       200:
 *         description: Produits de la boutique récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 boutique:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nom:
 *                       type: string
 *                     logo_url:
 *                       type: string
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nom_categorie:
 *                         type: string
 *                 docs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Produit'
 *                 totalDocs:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 page:
 *                   type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id/produits', boutiqueController.obtenirProduitsBoutique);

/**
 * @swagger
 * /boutiques/gerant/mon-boutique:
 *   get:
 *     tags: [Boutiques]
 *     summary: Obtenir ma boutique (gérant)
 *     description: Récupère les détails de la boutique du gérant connecté
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Détails de la boutique du gérant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/gerant/mon-boutique',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.obtenirMaBoutique
);

/**
 * @swagger
 * /boutiques/gerant/mon-profil:
 *   put:
 *     tags: [Boutiques]
 *     summary: Modifier le profil de la boutique (gérant)
 *     description: Permet au gérant de modifier les informations de sa boutique
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
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nom de la boutique
 *               description:
 *                 type: string
 *                 description: Description de la boutique
 *               slogan:
 *                 type: string
 *                 description: Slogan de la boutique
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   telephone:
 *                     type: string
 *                   horaires:
 *                     type: string
 *               parametres:
 *                 type: object
 *                 properties:
 *                   frais_livraison:
 *                     type: number
 *                     minimum: 0
 *                   delai_preparation:
 *                     type: integer
 *                     minimum: 0
 *                   livraison_gratuite_apres:
 *                     type: number
 *                     minimum: 0
 *                   accepte_retrait:
 *                     type: boolean
 *                   accepte_livraison:
 *                     type: boolean
 *               social:
 *                 type: object
 *                 properties:
 *                   website:
 *                     type: string
 *                   facebook:
 *                     type: string
 *                   instagram:
 *                     type: string
 *                   twitter:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profil boutique mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/gerant/mon-profil',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.gererProfilBoutique
);

/**
 * @swagger
 * /boutiques/gerant/logo:
 *   post:
 *     tags: [Boutiques]
 *     summary: Uploader un logo pour la boutique
 *     description: Permet au gérant d'uploader ou de changer le logo de sa boutique
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Fichier image (jpeg, jpg, png, gif, webp) - Max 5MB
 *     responses:
 *       200:
 *         description: Logo uploadé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 logo_url:
 *                   type: string
 *       400:
 *         description: Erreur d'upload ou fichier invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/gerant/logo',
  authMiddleware,
  roleMiddleware('boutique'),
  uploadBoutiqueLogo,
  handleUploadError,
  boutiqueController.uploadLogo
);

/**
 * @swagger
 * /boutiques:
 *   post:
 *     tags: [Boutiques]
 *     summary: Créer une nouvelle boutique (admin)
 *     description: Permet à l'admin de créer une nouvelle boutique avec un gérant
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, categorie, gerant]
 *             properties:
 *               nom:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nom de la boutique
 *               description:
 *                 type: string
 *                 description: Description de la boutique
 *               slogan:
 *                 type: string
 *                 description: Slogan de la boutique
 *               categorie:
 *                 type: string
 *                 description: ID de la catégorie
 *               gerant:
 *                 type: string
 *                 description: ID de l'utilisateur qui sera le gérant
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   telephone:
 *                     type: string
 *                   horaires:
 *                     type: string
 *               adresse:
 *                 type: object
 *                 properties:
 *                   etage:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   aile:
 *                     type: string
 *               parametres:
 *                 type: object
 *                 properties:
 *                   frais_livraison:
 *                     type: number
 *                     minimum: 0
 *                     default: 5
 *                   delai_preparation:
 *                     type: integer
 *                     minimum: 0
 *                     default: 30
 *                   livraison_gratuite_apres:
 *                     type: number
 *                     minimum: 0
 *                     default: 50
 *     responses:
 *       201:
 *         description: Boutique créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.creerBoutique
);

/**
 * @swagger
 * /boutiques/{id}:
 *   put:
 *     tags: [Boutiques]
 *     summary: Modifier une boutique (admin)
 *     description: Permet à l'admin de modifier une boutique existante
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               slogan:
 *                 type: string
 *               categorie:
 *                 type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   telephone:
 *                     type: string
 *                   horaires:
 *                     type: string
 *               adresse:
 *                 type: object
 *                 properties:
 *                   etage:
 *                     type: string
 *                   numero:
 *                     type: string
 *                   aile:
 *                     type: string
 *               parametres:
 *                 type: object
 *                 properties:
 *                   frais_livraison:
 *                     type: number
 *                     minimum: 0
 *                   delai_preparation:
 *                     type: integer
 *                     minimum: 0
 *                   livraison_gratuite_apres:
 *                     type: number
 *                     minimum: 0
 *               est_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Boutique mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.modifierBoutique
);

/**
 * @swagger
 * /boutiques/{id}/toggle-activation:
 *   put:
 *     tags: [Boutiques]
 *     summary: Activer/désactiver une boutique (admin)
 *     description: Permet à l'admin d'activer ou désactiver une boutique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique
 *     responses:
 *       200:
 *         description: Statut de la boutique modifié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/:id/toggle-activation',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.toggleActivationBoutique
);

module.exports = router;