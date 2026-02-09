const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Rôles
 *   description: Gestion des rôles et permissions (admin seulement)
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Lister tous les rôles
 *     tags: [Rôles]
 *     description: Récupère la liste de tous les rôles disponibles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rôles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nom_role:
 *                         type: string
 *                         enum: [admin_centre, boutique, acheteur]
 *                       description:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       date_creation:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  roleController.listerRoles
);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Créer un nouveau rôle
 *     tags: [Rôles]
 *     description: Crée un nouveau rôle personnalisé (les rôles système ne peuvent pas être modifiés)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom_role
 *             properties:
 *               nom_role:
 *                 type: string
 *                 description: Nom unique du rôle (ne peut pas être admin_centre, boutique ou acheteur)
 *                 example: moderateur
 *               description:
 *                 type: string
 *                 description: Description du rôle
 *                 example: Rôle de modérateur avec permissions limitées
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Liste des permissions du rôle
 *                 example: ["voir_statistiques", "moderer_avis"]
 *     responses:
 *       201:
 *         description: Rôle créé avec succès
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
 *                   example: Rôle créé avec succès
 *                 role:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nom_role:
 *                       type: string
 *                     description:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Rôle invalide ou déjà existant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  roleController.creerRole
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Obtenir un rôle par ID
 *     tags: [Rôles]
 *     description: Récupère les détails d'un rôle spécifique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Détails du rôle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 role:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nom_role:
 *                       type: string
 *                     description:
 *                       type: string
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     date_creation:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rôle non trouvé
 */
router.get('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  roleController.obtenirRole
);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Modifier un rôle
 *     tags: [Rôles]
 *     description: Met à jour les informations d'un rôle personnalisé
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Nouvelle description du rôle
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Nouvelles permissions du rôle
 *     responses:
 *       200:
 *         description: Rôle mis à jour avec succès
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
 *                   example: Rôle mis à jour avec succès
 *                 role:
 *                   type: object
 *       400:
 *         description: Impossible de modifier un rôle système
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rôle non trouvé
 */
router.put('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  roleController.modifierRole
);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Supprimer un rôle
 *     tags: [Rôles]
 *     description: Supprime un rôle personnalisé (ne peut pas supprimer les rôles système)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Rôle supprimé avec succès
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
 *                   example: Rôle supprimé avec succès
 *       400:
 *         description: Impossible de supprimer un rôle système
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rôle non trouvé
 */
router.delete('/:id', 
  authMiddleware, 
  roleMiddleware('admin_centre'), 
  roleController.supprimerRole
);

module.exports = router;