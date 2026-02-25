const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const Notification = require('../models/notification.model');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications des utilisateurs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         destinataire:
 *           type: string
 *           description: ID de l'utilisateur destinataire
 *         type:
 *           type: string
 *           enum: [paiement_location, nouvelle_boutique, commande, alerte]
 *         titre:
 *           type: string
 *         message:
 *           type: string
 *         donnees:
 *           type: object
 *         lu:
 *           type: boolean
 *           default: false
 *         date_creation:
 *           type: string
 *           format: date-time
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *     NotificationCountResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: integer
 *     NotificationUpdateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         notification:
 *           $ref: '#/components/schemas/Notification'
 *     NotificationMessageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Récupérer les notifications de l'utilisateur connecté
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications (50 dernières)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/',
  authMiddleware,
  async (req, res) => {
    try {
      const notifications = await Notification.find({ destinataire: req.user.id })
        .sort({ date_creation: -1 })
        .limit(50);
      res.json({ success: true, notifications });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /notifications/non-lues:
 *   get:
 *     summary: Compter les notifications non lues de l'utilisateur connecté
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de notifications non lues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationCountResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/non-lues',
  authMiddleware,
  async (req, res) => {
    try {
      const count = await Notification.countDocuments({ destinataire: req.user.id, lu: false });
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /notifications/{id}/lu:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification
 *     responses:
 *       200:
 *         description: Notification mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationUpdateResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: La notification ne vous appartient pas
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch('/:id/lu',
  authMiddleware,
  async (req, res) => {
    try {
      const notif = await Notification.findOneAndUpdate(
        { _id: req.params.id, destinataire: req.user.id },
        { lu: true },
        { new: true }
      );
      if (!notif) return res.status(404).json({ success: false, message: 'Notification non trouvée' });
      res.json({ success: true, notification: notif });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * @swagger
 * /notifications/lu-toutes:
 *   patch:
 *     summary: Marquer toutes les notifications de l'utilisateur comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toutes les notifications marquées comme lues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationMessageResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.patch('/lu-toutes',
  authMiddleware,
  async (req, res) => {
    try {
      await Notification.updateMany(
        { destinataire: req.user.id, lu: false },
        { lu: true }
      );
      res.json({ success: true, message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;