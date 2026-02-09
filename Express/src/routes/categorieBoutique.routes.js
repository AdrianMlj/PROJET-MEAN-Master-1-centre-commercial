const express = require('express');
const router = express.Router();
const categorieBoutiqueController = require('../controllers/categorieBoutique.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * /categories-boutique:
 *   get:
 *     tags: [Catégories Boutiques]
 *     summary: Lister toutes les catégories de boutiques
 *     description: Récupère la liste des catégories de boutiques (publique)
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nom_categorie:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icone:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       est_active:
 *                         type: boolean
 *                       ordre_affichage:
 *                         type: integer
 *                       nombre_boutiques:
 *                         type: integer
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/', categorieBoutiqueController.listerCategories);

/**
 * @swagger
 * /categories-boutique/{id}:
 *   get:
 *     tags: [Catégories Boutiques]
 *     summary: Obtenir une catégorie par ID
 *     description: Récupère les détails d'une catégorie spécifique
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie
 *     responses:
 *       200:
 *         description: Détails de la catégorie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categorie:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nom_categorie:
 *                       type: string
 *                     description:
 *                       type: string
 *                     icone:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     est_active:
 *                       type: boolean
 *                     ordre_affichage:
 *                       type: integer
 *                     nombre_boutiques:
 *                       type: integer
 *                     date_creation:
 *                       type: string
 *                       format: date-time
 *                     date_modification:
 *                       type: string
 *                       format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id', categorieBoutiqueController.obtenirCategorie);

/**
 * @swagger
 * /categories-boutique/admin/toutes:
 *   get:
 *     tags: [Catégories Boutiques]
 *     summary: Lister toutes les catégories (admin)
 *     description: Récupère la liste complète des catégories, y compris les inactives (admin seulement)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste complète des catégories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nom_categorie:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icone:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       est_active:
 *                         type: boolean
 *                       ordre_affichage:
 *                         type: integer
 *                       nombre_boutiques:
 *                         type: integer
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
  categorieBoutiqueController.listerToutesCategories
);

/**
 * @swagger
 * /categories-boutique:
 *   post:
 *     tags: [Catégories Boutiques]
 *     summary: Créer une nouvelle catégorie (admin)
 *     description: Permet à l'admin de créer une nouvelle catégorie de boutiques
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom_categorie]
 *             properties:
 *               nom_categorie:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nom de la catégorie
 *               description:
 *                 type: string
 *                 description: Description de la catégorie
 *               icone:
 *                 type: string
 *                 description: Icône représentative
 *                 default: "🛍️"
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL de l'image de la catégorie
 *               ordre_affichage:
 *                 type: integer
 *                 description: Ordre d'affichage (plus petit = premier)
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
 *                 message:
 *                   type: string
 *                 categorie:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nom_categorie:
 *                       type: string
 *                     description:
 *                       type: string
 *                     icone:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     est_active:
 *                       type: boolean
 *                     ordre_affichage:
 *                       type: integer
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
  categorieBoutiqueController.creerCategorie
);

/**
 * @swagger
 * /categories-boutique/{id}:
 *   put:
 *     tags: [Catégories Boutiques]
 *     summary: Modifier une catégorie (admin)
 *     description: Permet à l'admin de modifier une catégorie existante
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie à modifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom_categorie:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *               icone:
 *                 type: string
 *               image_url:
 *                 type: string
 *                 format: uri
 *               ordre_affichage:
 *                 type: integer
 *               est_active:
 *                 type: boolean
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
 *                 message:
 *                   type: string
 *                 categorie:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nom_categorie:
 *                       type: string
 *                     description:
 *                       type: string
 *                     icone:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     est_active:
 *                       type: boolean
 *                     ordre_affichage:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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
  categorieBoutiqueController.modifierCategorie
);

/**
 * @swagger
 * /categories-boutique/{id}:
 *   delete:
 *     tags: [Catégories Boutiques]
 *     summary: Supprimer une catégorie (admin)
 *     description: Permet à l'admin de supprimer une catégorie (si aucune boutique ne l'utilise)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie à supprimer
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Impossible de supprimer (catégorie utilisée par des boutiques)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.delete('/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  categorieBoutiqueController.supprimerCategorie
);

module.exports = router;