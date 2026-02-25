const express = require('express');
const router = express.Router();
const boutiqueController = require('../controllers/boutique.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');
const { uploadBoutiqueLogo, uploadMultipleImages, handleUploadError } = require('../middlewares/upload.middleware');

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
 * /boutiques/admin/toutes:
 *   get:
 *     tags: [Boutiques]
 *     summary: Lister toutes les boutiques (admin)
 *     description: Récupère la liste complète des boutiques, y compris les inactives. Réservé à l'admin.
 *     security:
 *       - bearerAuth: []
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
 *         description: Filtrer par statut d'activation (true/false)
 *       - in: query
 *         name: statut_paiement
 *         schema:
 *           type: string
 *           enum: [paye, impaye]
 *         description: Filtrer par statut de paiement
 *       - in: query
 *         name: recherche
 *         schema:
 *           type: string
 *         description: Rechercher par nom, description, email
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [date_creation, nom_asc, nom_desc, ventes, chiffre_affaires, note, paiement]
 *           default: date_creation
 *         description: Critère de tri
 *     responses:
 *       200:
 *         description: Liste complète des boutiques
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     actives:
 *                       type: integer
 *                     inactives:
 *                       type: integer
 *                     payees:
 *                       type: integer
 *                     impayees:
 *                       type: integer
 *                 docs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Boutique'
 *                 totalDocs:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 hasNextPage:
 *                   type: boolean
 *                 hasPrevPage:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/admin/toutes',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.listerToutesBoutiques
);

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
 * /boutiques/admin/{id}:
 *   get:
 *     tags: [Boutiques]
 *     summary: Récupérer une boutique par ID (admin)
 *     description: Permet à l'admin de récupérer une boutique spécifique même si elle est inactive
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
 *         description: Détails de la boutique
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 boutique:
 *                   $ref: '#/components/schemas/Boutique'
 *       400:
 *         description: ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID de boutique invalide"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Boutique non trouvée"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/admin/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.obtenirBoutiqueAdmin
);

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
 *     description: Permet à l'admin de modifier une boutique existante, y compris le gérant
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
 *                 example: "Nouveau nom"
 *               description:
 *                 type: string
 *                 example: "Nouvelle description"
 *               slogan:
 *                 type: string
 *                 example: "Nouveau slogan"
 *               categorie:
 *                 type: string
 *                 example: "65b3a1f2e4b0a1b2c3d4e5f6"
 *               gerant:  
 *                 type: string
 *                 description: ID du nouveau gérant (doit avoir rôle boutique)
 *                 example: "65b3a1f2e4b0a1b2c3d4e5f7"
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
 *                 example: true
 *     responses:
 *       200:
 *         description: Boutique mise à jour avec succès
 *       400:
 *         description: Erreur de validation (gérant non trouvé, mauvais rôle, etc.)
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

/**
 * @swagger
 * /boutiques/gerant/logo:
 *   put:
 *     tags: [Boutiques]
 *     summary: Mettre à jour le logo de la boutique
 *     description: Permet au gérant de modifier le logo existant de sa boutique
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
 *                 description: Nouveau fichier logo (jpeg, jpg, png, gif, webp) - Max 5MB
 *     responses:
 *       200:
 *         description: Logo mis à jour avec succès
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
 *                   example: "Logo mis à jour avec succès"
 *                 logo_url:
 *                   type: string
 *                   example: "/uploads/boutiques/logo-1648291038472-123456.jpg"
 *       400:
 *         description: Erreur d'upload ou fichier invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.put('/gerant/logo',
  authMiddleware,
  roleMiddleware('boutique'),
  uploadBoutiqueLogo,
  handleUploadError,
  boutiqueController.updateLogo
);

/**
 * @swagger
 * /boutiques/gerant/images:
 *   post:
 *     tags: [Boutiques]
 *     summary: Uploader plusieurs images pour la boutique
 *     description: Permet au gérant d'uploader plusieurs photos pour la galerie de sa boutique (max 5 images par requête)
 *     security:
 *       - bearerAuth: []
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
 *                 description: Fichiers images (jpeg, jpg, png, gif, webp) - Max 5 fichiers, 5MB chacun
 *     responses:
 *       200:
 *         description: Images uploadées avec succès
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
 *                   example: "3 image(s) uploadée(s) avec succès"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/uploads/boutiques/image-1648291038472-123456.jpg", "/uploads/boutiques/image-1648291038472-789012.jpg"]
 *                 total_images:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Erreur d'upload ou fichier invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Aucun fichier uploadé"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       413:
 *         description: Fichier trop volumineux
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Fichier trop volumineux. Taille maximale: 5MB"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/gerant/images',
  authMiddleware,
  roleMiddleware('boutique'),
  uploadMultipleImages,    // Middleware pour plusieurs fichiers (max 5)
  handleUploadError,       // Gestionnaire d'erreurs
  boutiqueController.uploadImages
);

/**
 * @swagger
 * /boutiques/gerant/images/{index}:
 *   delete:
 *     tags: [Boutiques]
 *     summary: Supprimer une image de la galerie
 *     description: Permet au gérant de supprimer une image spécifique de la galerie de sa boutique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index de l'image à supprimer dans le tableau (0 = première image)
 *         example: 2
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
 *                 image_supprimee:
 *                   type: string
 *                   example: "/uploads/boutiques/image-1648291038472-123456.jpg"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/uploads/boutiques/image-1648291038472-789012.jpg", "/uploads/boutiques/image-1648291038472-345678.jpg"]
 *       400:
 *         description: Index d'image invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Index d'image invalide"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Boutique non trouvée"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/gerant/images/:index',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.supprimerImage
);

/**
 * @swagger
 * /boutiques/gerant/images:
 *   get:
 *     tags: [Boutiques]
 *     summary: Récupérer toutes les images de la boutique
 *     description: Permet au gérant de voir toutes les images (logo + galerie) de sa boutique
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Images récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logo_url:
 *                   type: string
 *                   example: "/uploads/boutiques/logo-1648291038472-123456.jpg"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/uploads/boutiques/image-1.jpg", "/uploads/boutiques/image-2.jpg"]
 *                 total_images:
 *                   type: integer
 *                   example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/gerant/images',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.getImages
);

/**
 * @swagger
 * /boutiques/gerant/images/{index}/set-principale:
 *   patch:
 *     tags: [Boutiques]
 *     summary: Définir une image comme principale
 *     description: Permet au gérant de définir une image de la galerie comme image principale
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index de l'image à définir comme principale
 *         example: 1
 *     responses:
 *       200:
 *         description: Image principale mise à jour avec succès
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
 *                   example: "Image principale mise à jour avec succès"
 *                 image_principale:
 *                   type: string
 *                   example: "/uploads/boutiques/image-1648291038472-789012.jpg"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Index d'image invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch('/gerant/images/:index/set-principale',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.setImagePrincipale
);

/**
 * @swagger
 * /boutiques/gerant/payer:
 *   post:
 *     tags: [Boutiques]
 *     summary: Payer la location mensuelle
 *     description: La boutique appelle cette API pour payer sa location (statut passe à "paye")
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       optional: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               methode_paiement:
 *                 type: string
 *                 enum: [carte, virement, mobile]
 *                 default: carte
 *                 description: Méthode de paiement (pour futur usage)
 *     responses:
 *       200:
 *         description: Paiement effectué avec succès
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
 *                   example: "✅ Paiement de la location effectué avec succès"
 *                 boutique:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "65b3a1f2e4b0a1b2c3d4e5f6"
 *                     nom:
 *                       type: string
 *                       example: "Ma Boutique"
 *                     statut_paiement:
 *                       type: string
 *                       enum: [paye, impaye]
 *                       example: "paye"
 *                     est_active:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: La boutique a déjà payé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "La boutique a déjà payé sa location"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Boutique non trouvée"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/gerant/payer',
  authMiddleware,
  roleMiddleware('boutique'),
  boutiqueController.payerLocation
);

/**
 * @swagger
 * /boutiques/admin/{id}:
 *   delete:
 *     tags: [Boutiques]
 *     summary: Supprimer une boutique (admin seulement)
 *     description: ⚠️ Supprime définitivement une boutique, ses produits, et dissocie le gérant. Action irréversible.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la boutique à supprimer
 *     responses:
 *       200:
 *         description: Boutique supprimée avec succès
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
 *                   example: "✅ Boutique \"Ma Boutique\" supprimée avec succès"
 *                 details:
 *                   type: object
 *                   properties:
 *                     boutique_supprimee:
 *                       type: string
 *                     produits_supprimes:
 *                       type: boolean
 *                     gerant_dissocie:
 *                       type: boolean
 *       400:
 *         description: ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "ID de boutique invalide"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Boutique non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Boutique non trouvée"
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/admin/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  boutiqueController.supprimerBoutique
);

module.exports = router;