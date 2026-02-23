const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commande.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Commandes
 *   description: Gestion des commandes
 */

/**
 * @swagger
 * /commandes:
 *   post:
 *     summary: Passer une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adresse_livraison
 *               - methode_paiement
 *             properties:
 *               adresse_livraison:
 *                 type: object
 *                 required:
 *                   - nom_complet
 *                   - telephone
 *                   - rue
 *                   - ville
 *                   - code_postal
 *                 properties:
 *                   nom_complet:
 *                     type: string
 *                     example: "Jean Dupont"
 *                   telephone:
 *                     type: string
 *                     example: "+33612345678"
 *                   rue:
 *                     type: string
 *                     example: "123 Avenue du Commerce"
 *                   complement:
 *                     type: string
 *                     example: "Appartement 4B"
 *                   ville:
 *                     type: string
 *                     example: "Paris"
 *                   code_postal:
 *                     type: string
 *                     example: "75000"
 *                   pays:
 *                     type: string
 *                     example: "France"
 *                   instructions:
 *                     type: string
 *                     example: "Sonner 3 fois"
 *               mode_livraison:
 *                 type: string
 *                 enum: [retrait_boutique, livraison_standard, livraison_express]
 *                 default: livraison_standard
 *               notes:
 *                 type: string
 *                 description: "Notes supplémentaires pour la commande"
 *               methode_paiement:
 *                 type: string
 *                 enum: [carte_credit, especes, virement, mobile, carte_bancaire]
 *                 example: carte_credit
 *     responses:
 *       201:
 *         description: Commande(s) passée(s) avec succès
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
 *                   example: "Commande(s) passée(s) avec succès"
 *                 commandes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Commande'
 *                 nombre_commandes:
 *                   type: integer
 *                   description: Nombre de commandes créées
 *                   example: 2
 *       400:
 *         description: Erreur de validation ou panier vide
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.passerCommande
);

/**
 * @swagger
 * /commandes/mes-commandes:
 *   get:
 *     summary: Obtenir les commandes de l'utilisateur connecté
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, en_preparation, pret, livre, annule, refuse]
 *         description: Filtrer par statut
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
 *         description: Liste des commandes récupérée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/mes-commandes',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.obtenirCommandesClient
);

/**
 * @swagger
 * /commandes/boutique/mes-commandes:
 *   get:
 *     summary: Obtenir les commandes de la boutique du gérant connecté
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, en_preparation, pret, livre, annule, refuse]
 *         description: Filtrer par statut
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
 *       - in: query
 *         name: recherche
 *         schema:
 *           type: string
 *         description: Rechercher par numéro de commande ou nom client
 *     responses:
 *       200:
 *         description: Liste des commandes de la boutique
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/boutique/mes-commandes',
  authMiddleware,
  roleMiddleware('boutique'),
  commandeController.obtenirCommandesBoutique
);

/**
 * @swagger
 * /commandes/{id}:
 *   get:
 *     summary: Obtenir les détails d'une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Détails de la commande
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Commande non trouvée
 */
router.get('/:id',
  authMiddleware,
  commandeController.obtenirDetailCommande
);

/**
 * @swagger
 * /commandes/{id}/historique:
 *   get:
 *     summary: Obtenir l'historique des statuts d'une commande
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Historique des statuts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 historique:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ancien_statut:
 *                         type: string
 *                       nouveau_statut:
 *                         type: string
 *                       date_modification:
 *                         type: string
 *                         format: date-time
 *                       utilisateur_modif:
 *                         type: object
 *                         properties:
 *                           nom:
 *                             type: string
 *                           prenom:
 *                             type: string
 *                       raison:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/:id/historique',
  authMiddleware,
  commandeController.obtenirHistoriqueStatuts
);

/**
 * @swagger
 * /commandes/{id}/annuler:
 *   put:
 *     summary: Annuler une commande (client seulement)
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande à annuler
 *     responses:
 *       200:
 *         description: Commande annulée avec succès
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
 *                   example: "Commande annulée avec succès"
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
 *       400:
 *         description: La commande ne peut pas être annulée
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Commande non trouvée
 */
router.put('/:id/annuler',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.annulerCommande
);

/**
 * @swagger
 * /commandes/{id}/statut:
 *   put:
 *     summary: Mettre à jour le statut d'une commande (gérant seulement)
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nouveau_statut
 *             properties:
 *               nouveau_statut:
 *                 type: string
 *                 enum: [en_preparation, pret, livre, annule, refuse]
 *                 description: Nouveau statut de la commande
 *               raison:
 *                 type: string
 *                 description: Raison du changement de statut
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
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
 *                   example: "Statut de la commande mis à jour: en_preparation"
 *                 commande:
 *                   $ref: '#/components/schemas/Commande'
 *       400:
 *         description: Transition de statut invalide
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Commande non trouvée
 */
router.put('/:id/statut',
  authMiddleware,
  roleMiddleware('boutique'),
  commandeController.mettreAJourStatutCommande
);

/**
 * @swagger
 * /commandes/admin/toutes:
 *   get:
 *     summary: Obtenir toutes les commandes (admin seulement)
 *     tags: [Commandes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [en_attente, en_preparation, pret, livre, annule, refuse]
 *         description: Filtrer par statut
 *       - in: query
 *         name: boutique
 *         schema:
 *           type: string
 *         description: Filtrer par ID de boutique
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtrer par ID de client
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
 *         description: Liste de toutes les commandes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/toutes',
  authMiddleware,
  roleMiddleware('admin_centre'),
  commandeController.obtenirToutesCommandes
);

/**
 * @swagger
 * /commandes/{id}/payer:
 *   post:
 *     tags: [Commandes]
 *     summary: Payer une commande (client)
 *     description: Permet au client de payer une commande après confirmation de la boutique
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               methode_paiement:
 *                 type: string
 *                 enum: [carte_credit, virement, mobile]
 *                 default: carte_credit
 *               token_paiement:
 *                 type: string
 *                 description: Token du fournisseur de paiement (optionnel)
 *     responses:
 *       200:
 *         description: Paiement effectué
 *       400:
 *         description: Commande non payable
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/:id/payer',
  authMiddleware,
  roleMiddleware('acheteur'),
  commandeController.payerCommande
);

/**
 * @swagger
 * /commandes/{id}/facture:
 *   get:
 *     tags: [Commandes]
 *     summary: Télécharger la facture PDF de la commande
 *     description: Génère et télécharge un PDF récapitulatif de la commande (accessible par le client ou l'admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       200:
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/:id/facture',
  authMiddleware,
  commandeController.genererFacturePDF
);

module.exports = router;