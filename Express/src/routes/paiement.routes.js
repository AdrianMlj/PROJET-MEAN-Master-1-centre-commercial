const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiement.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Paiements
 *   description: Gestion des paiements
 */

/**
 * @swagger
 * /paiements/{id}:
 *   get:
 *     summary: Obtenir les détails d'un paiement
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du paiement
 *     responses:
 *       200:
 *         description: Détails du paiement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paiement:
 *                   $ref: '#/components/schemas/Paiement'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Paiement non trouvé
 */
router.get('/:id',
  authMiddleware,
  paiementController.obtenirPaiement
);

/**
 * @swagger
 * /paiements/commande/{commandeId}:
 *   get:
 *     summary: Obtenir les paiements d'une commande
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commandeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Liste des paiements de la commande
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 paiements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Paiement'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/commande/:commandeId',
  authMiddleware,
  paiementController.obtenirPaiementsCommande
);

/**
 * @swagger
 * /paiements/admin/tous:
 *   get:
 *     summary: Obtenir tous les paiements (admin seulement)
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut_paiement
 *         schema:
 *           type: string
 *           enum: [en_attente, paye, echec, rembourse, partiel]
 *         description: Filtrer par statut de paiement
 *       - in: query
 *         name: methode_paiement
 *         schema:
 *           type: string
 *           enum: [carte_credit, especes, virement, mobile, carte_bancaire]
 *         description: Filtrer par méthode de paiement
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: date_debut
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer
 *       - in: query
 *         name: date_fin
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer
 *     responses:
 *       200:
 *         description: Liste des paiements
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/tous',
  authMiddleware,
  roleMiddleware('admin_centre'),
  paiementController.obtenirTousPaiements
);

/**
 * @swagger
 * /paiements/{id}/statut:
 *   put:
 *     summary: Mettre à jour le statut d'un paiement (admin seulement)
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du paiement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut_paiement
 *             properties:
 *               statut_paiement:
 *                 type: string
 *                 enum: [paye, echec, rembourse, partiel]
 *                 description: Nouveau statut du paiement
 *               details_paiement:
 *                 type: object
 *                 description: Détails supplémentaires du paiement
 *                 properties:
 *                   derniers_4_chiffres:
 *                     type: string
 *                     example: "1234"
 *                   nom_carte:
 *                     type: string
 *                     example: "VISA"
 *                   date_expiration:
 *                     type: string
 *                     example: "12/25"
 *                   banque:
 *                     type: string
 *                     example: "Banque Nationale"
 *     responses:
 *       200:
 *         description: Statut du paiement mis à jour
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
 *                   example: "Statut de paiement mis à jour: en_attente -> paye"
 *                 paiement:
 *                   $ref: '#/components/schemas/Paiement'
 *       400:
 *         description: Statut de paiement invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Paiement non trouvé
 */
router.put('/:id/statut',
  authMiddleware,
  roleMiddleware('admin_centre'),
  paiementController.mettreAJourStatutPaiement
);

/**
 * @swagger
 * /paiements/{id}/remboursement:
 *   post:
 *     summary: Créer un remboursement (admin seulement)
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du paiement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - montant_rembourse
 *             properties:
 *               montant_rembourse:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Montant à rembourser
 *                 example: 29.99
 *               raison:
 *                 type: string
 *                 description: Raison du remboursement
 *                 example: "Produit défectueux"
 *               reference_remboursement:
 *                 type: string
 *                 description: Référence du remboursement
 *                 example: "REMBOURS-20231201-0001"
 *     responses:
 *       200:
 *         description: Remboursement effectué avec succès
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
 *                   example: "Remboursement effectué avec succès"
 *                 paiement:
 *                   $ref: '#/components/schemas/Paiement'
 *       400:
 *         description: Montant invalide ou paiement non éligible
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Paiement non trouvé
 */
router.post('/:id/remboursement',
  authMiddleware,
  roleMiddleware('admin_centre'),
  paiementController.creerRemboursement
);

module.exports = router;