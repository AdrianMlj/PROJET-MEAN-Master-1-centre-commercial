const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: Fonctions d'administration avancées (admin seulement)
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Dashboard administrateur avec statistiques complètes
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     statistiques:
 *                       type: object
 *                       properties:
 *                         boutiques:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             actives:
 *                               type: integer
 *                             inactives:
 *                               type: integer
 *                         utilisateurs:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             acheteurs_actifs:
 *                               type: integer
 *                         commandes:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             ce_mois:
 *                               type: integer
 *                             cette_semaine:
 *                               type: integer
 *                         produits:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                         chiffre_affaires:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                             ce_mois:
 *                               type: number
 *                             cette_semaine:
 *                               type: number
 *                     repartition_commandes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     boutiques_performantes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           boutique:
 *                             type: string
 *                           nombreCommandes:
 *                             type: integer
 *                           chiffreAffaires:
 *                             type: number
 *                     produits_vendus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           produit:
 *                             type: string
 *                           boutique:
 *                             type: string
 *                           quantiteVendue:
 *                             type: integer
 *                           chiffreAffaires:
 *                             type: number
 *                     evolution_ca:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           chiffreAffaires:
 *                             type: number
 *                           nombreCommandes:
 *                             type: integer
 *                     categories_populaires:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categorie:
 *                             type: string
 *                           nombreBoutiques:
 *                             type: integer
 *                     alertes:
 *                       type: object
 *                       properties:
 *                         boutiques_inactives:
 *                           type: integer
 *                         produits_rupture:
 *                           type: integer
 *                         produits_faible_stock:
 *                           type: integer
 *                         commandes_en_attente:
 *                           type: integer
 *                     dernieres_activites:
 *                       type: object
 *                       properties:
 *                         commandes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Commande'
 *                         utilisateurs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Utilisateur'
 *                         boutiques:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Boutique'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/dashboard',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.dashboardAdmin
);

/**
 * @swagger
 * /admin/parametres:
 *   put:
 *     summary: Gérer les paramètres du centre commercial
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom_centre:
 *                 type: string
 *                 description: Nom du centre commercial
 *                 example: "Centre Commercial M1P13"
 *               description:
 *                 type: string
 *                 description: Description du centre commercial
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Email de contact
 *               contact_telephone:
 *                 type: string
 *                 description: Téléphone de contact
 *               horaires_ouverture:
 *                 type: string
 *                 description: Horaires d'ouverture
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
 *               frais_livraison_par_defaut:
 *                 type: number
 *                 minimum: 0
 *                 description: Frais de livraison par défaut
 *               seuil_livraison_gratuite:
 *                 type: number
 *                 minimum: 0
 *                 description: Seuil pour la livraison gratuite
 *               taux_tva:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Taux de TVA en pourcentage
 *               maintenance_mode:
 *                 type: boolean
 *                 description: Mode maintenance activé/désactivé
 *     responses:
 *       200:
 *         description: Paramètres mis à jour avec succès
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
 *                   example: "Paramètres mis à jour avec succès"
 *                 parametres:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/parametres',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.gererParametresCentre
);

/**
 * @swagger
 * /admin/categories-boutique:
 *   post:
 *     summary: Créer une nouvelle catégorie de boutique
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - nom_categorie
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [creer]
 *                 example: "creer"
 *               nom_categorie:
 *                 type: string
 *                 description: Nom de la catégorie
 *                 example: "Nouvelle Catégorie"
 *               description:
 *                 type: string
 *                 description: Description de la catégorie
 *               icone:
 *                 type: string
 *                 description: Icône représentative
 *                 example: "🛍️"
 *               est_active:
 *                 type: boolean
 *                 description: Statut d'activation
 *                 default: true
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
 *                   example: "Catégorie créée avec succès"
 *                 categorie:
 *                   $ref: '#/components/schemas/CategorieBoutique'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/categories-boutique',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.gererCategoriesBoutique
);

/**
 * @swagger
 * /admin/categories-boutique/{id}:
 *   put:
 *     summary: Modifier une catégorie de boutique existante
 *     tags: [Administration]
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
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [modifier]
 *                 example: "modifier"
 *               nom_categorie:
 *                 type: string
 *                 description: Nouveau nom de la catégorie
 *               description:
 *                 type: string
 *                 description: Nouvelle description
 *               icone:
 *                 type: string
 *                 description: Nouvelle icône
 *               est_active:
 *                 type: boolean
 *                 description: Nouveau statut d'activation
 *               ordre_affichage:
 *                 type: integer
 *                 description: Nouvel ordre d'affichage
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
 *                   example: "Catégorie mise à jour avec succès"
 *                 categorie:
 *                   $ref: '#/components/schemas/CategorieBoutique'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/categories-boutique/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.gererCategoriesBoutique
);

/**
 * @swagger
 * /admin/categories-boutique/{id}:
 *   delete:
 *     summary: Supprimer une catégorie de boutique
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la catégorie à supprimer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [supprimer]
 *                 example: "supprimer"
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
 *                   example: "Catégorie supprimée avec succès"
 *       400:
 *         description: Impossible de supprimer car des boutiques utilisent cette catégorie
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/categories-boutique/:id',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.gererCategoriesBoutique
);

/**
 * @swagger
 * /admin/roles-permissions:
 *   put:
 *     summary: Gérer les permissions des rôles
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required:
 *                   - action
 *                   - role_id
 *                   - permissions
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [ajouter_permission, retirer_permission]
 *                     example: "ajouter_permission"
 *                   role_id:
 *                     type: string
 *                     description: ID du rôle à modifier
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Liste des permissions à ajouter/retirer
 *               - type: object
 *                 required:
 *                   - action
 *                   - role_id
 *                   - description
 *                 properties:
 *                   action:
 *                     type: string
 *                     enum: [modifier_description]
 *                     example: "modifier_description"
 *                   role_id:
 *                     type: string
 *                     description: ID du rôle à modifier
 *                   description:
 *                     type: string
 *                     description: Nouvelle description du rôle
 *     responses:
 *       200:
 *         description: Permissions mises à jour avec succès
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
 *                 role:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/roles-permissions',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.gererRolesPermissions
);

/**
 * @swagger
 * /admin/rapports:
 *   post:
 *     summary: Générer des rapports détaillés
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [commandes, ventes, boutiques, produits, utilisateurs]
 *                 description: Type de rapport à générer
 *                 example: "commandes"
 *               date_debut:
 *                 type: string
 *                 format: date
 *                 description: Date de début de la période
 *                 example: "2024-01-01"
 *               date_fin:
 *                 type: string
 *                 format: date
 *                 description: Date de fin de la période
 *                 example: "2024-12-31"
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *                 description: Format de sortie du rapport
 *                 default: "json"
 *     responses:
 *       200:
 *         description: Rapport généré avec succès
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
 *                   example: "Rapport généré avec succès"
 *                 rapport:
 *                   type: object
 *                   description: Contenu du rapport
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     date_debut:
 *                       type: string
 *                       format: date-time
 *                     date_fin:
 *                       type: string
 *                       format: date-time
 *                     format:
 *                       type: string
 *                     generer_le:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/rapports',
  authMiddleware,
  roleMiddleware('admin_centre'),
  adminController.genererRapports
);

module.exports = router;