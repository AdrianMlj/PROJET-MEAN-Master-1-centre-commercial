const express = require('express');
const router = express.Router();
const statistiquesController = require('../controllers/statistiques.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

/**
 * @swagger
 * tags:
 *   name: Statistiques
 *   description: Statistiques et rapports
 */

/**
 * @swagger
 * /api/statistiques/globales:
 *   get:
 *     summary: Statistiques globales (admin seulement)
 *     description: Récupère les statistiques globales du centre commercial
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques globales récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalBoutiques:
 *                       type: integer
 *                       description: Nombre total de boutiques
 *                       example: 25
 *                     boutiquesActives:
 *                       type: integer
 *                       description: Nombre de boutiques actives
 *                       example: 20
 *                     totalAcheteurs:
 *                       type: integer
 *                       description: Nombre total d'acheteurs
 *                       example: 1500
 *                     totalCommandes:
 *                       type: integer
 *                       description: Nombre total de commandes
 *                       example: 5000
 *                     commandesCeMois:
 *                       type: integer
 *                       description: Nombre de commandes ce mois-ci
 *                       example: 250
 *                     chiffreAffairesTotal:
 *                       type: number
 *                       format: float
 *                       description: Chiffre d'affaires total
 *                       example: 125000.50
 *                     boutiquePlusActive:
 *                       type: object
 *                       description: Boutique la plus active
 *                       properties:
 *                         boutique:
 *                           type: string
 *                           example: "La Boutique Moderne"
 *                         nombreCommandes:
 *                           type: integer
 *                           example: 120
 *                         chiffreAffaires:
 *                           type: number
 *                           format: float
 *                           example: 25000.00
 *                     produitsPlusVendus:
 *                       type: array
 *                       description: Liste des produits les plus vendus
 *                       items:
 *                         type: object
 *                         properties:
 *                           produit:
 *                             type: string
 *                             example: "T-shirt en coton"
 *                           quantiteVendue:
 *                             type: integer
 *                             example: 450
 *                           chiffreAffaires:
 *                             type: number
 *                             format: float
 *                             example: 13500.00
 *                     evolutionCA:
 *                       type: array
 *                       description: Évolution du chiffre d'affaires sur 30 jours
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             format: date
 *                             example: "2023-12-01"
 *                           chiffreAffaires:
 *                             type: number
 *                             format: float
 *                             example: 1250.50
 *                           nombreCommandes:
 *                             type: integer
 *                             example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         description: Erreur serveur
 */
router.get('/globales',
  authMiddleware,
  roleMiddleware('admin_centre'),
  statistiquesController.statistiquesGlobales
);

/**
 * @swagger
 * /api/statistiques/admin/dashboard:
 *   get:
 *     summary: Dashboard administrateur
 *     description: Récupère le dashboard complet pour l'administration
 *     tags: [Statistiques]
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
 *                     statistiquesRecentes:
 *                       type: object
 *                       description: Statistiques des 7 derniers jours
 *                       properties:
 *                         nouvellesCommandes:
 *                           type: integer
 *                           example: 50
 *                         nouveauxUtilisateurs:
 *                           type: integer
 *                           example: 25
 *                         nouvellesBoutiques:
 *                           type: integer
 *                           example: 3
 *                         chiffreAffairesRecent:
 *                           type: number
 *                           format: float
 *                           example: 7500.00
 *                     alertes:
 *                       type: object
 *                       description: Alertes et notifications
 *                       properties:
 *                         boutiquesInactives:
 *                           type: integer
 *                           example: 5
 *                         produitsRupture:
 *                           type: integer
 *                           example: 12
 *                         commandesEnAttente:
 *                           type: integer
 *                           example: 8
 *                     recent:
 *                       type: object
 *                       description: Activités récentes
 *                       properties:
 *                         commandes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Commande'
 *                         utilisateurs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Utilisateur'
 *                         produits:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Produit'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/admin/dashboard',
  authMiddleware,
  roleMiddleware('admin_centre'),
  statistiquesController.dashboardAdmin
);

/**
 * @swagger
 * /api/statistiques/boutique:
 *   get:
 *     summary: Statistiques de la boutique (gérants seulement)
 *     description: Récupère les statistiques d'une boutique spécifique
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques de la boutique récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 boutique:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     nom:
 *                       type: string
 *                       example: "La Boutique Moderne"
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalCommandes:
 *                       type: integer
 *                       example: 120
 *                     commandesEnAttente:
 *                       type: integer
 *                       example: 5
 *                     commandesEnPreparation:
 *                       type: integer
 *                       example: 8
 *                     commandesLivrees:
 *                       type: integer
 *                       example: 107
 *                     commandesCeMois:
 *                       type: integer
 *                       example: 25
 *                     produitsActifs:
 *                       type: integer
 *                       example: 45
 *                     chiffreAffairesTotal:
 *                       type: number
 *                       format: float
 *                       example: 25000.50
 *                     produitsPlusVendus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           produit:
 *                             type: string
 *                             example: "T-shirt en coton"
 *                           quantiteVendue:
 *                             type: integer
 *                             example: 45
 *                           chiffreAffaires:
 *                             type: number
 *                             format: float
 *                             example: 1350.00
 *                     evolutionVentes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             format: date
 *                             example: "2023-12-01"
 *                           chiffreAffaires:
 *                             type: number
 *                             format: float
 *                           nombreCommandes:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/boutique',
  authMiddleware,
  roleMiddleware('boutique'),
  statistiquesController.statistiquesBoutique
);

/**
 * @swagger
 * /api/statistiques/boutique/produits:
 *   get:
 *     summary: Statistiques des produits de la boutique
 *     description: Récupère les statistiques détaillées des produits d'une boutique
 *     tags: [Statistiques]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tri
 *         schema:
 *           type: string
 *           enum: [ventes, vues, stock, prix, note, promotion]
 *         description: Critère de tri
 *         default: ventes
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Nombre maximum de produits à retourner
 *         default: 20
 *       - in: query
 *         name: categorie
 *         schema:
 *           type: string
 *         description: Filtrer par catégorie de produit
 *     responses:
 *       200:
 *         description: Statistiques des produits récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 produits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Produit'
 *                 statistiques:
 *                   type: object
 *                   properties:
 *                     totalProduits:
 *                       type: integer
 *                       example: 45
 *                     produitsActifs:
 *                       type: integer
 *                       example: 40
 *                     produitsEnPromotion:
 *                       type: integer
 *                       example: 5
 *                     stockTotal:
 *                       type: integer
 *                       example: 450
 *                     produitsFaibleStock:
 *                       type: integer
 *                       example: 8
 *                     produitsRuptureStock:
 *                       type: integer
 *                       example: 3
 *                     totalVentes:
 *                       type: integer
 *                       example: 250
 *                 repartitionCategories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categorie:
 *                         type: string
 *                         example: "T-shirts"
 *                       count:
 *                         type: integer
 *                         example: 15
 *                       totalStock:
 *                         type: integer
 *                         example: 150
 *                       totalVentes:
 *                         type: integer
 *                         example: 120
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/boutique/produits',
  authMiddleware,
  roleMiddleware('boutique'),
  statistiquesController.statistiquesProduitsBoutique
);

module.exports = router;