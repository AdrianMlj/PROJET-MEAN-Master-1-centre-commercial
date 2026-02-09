const Paiement = require('../models/paiement.model');
const Commande = require('../models/commande.model');
const Boutique = require('../models/boutique.model');

// Obtenir les détails d'un paiement
exports.obtenirPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate('commande');

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier les permissions
    const commande = await Commande.findById(paiement.commande._id);
    
    if (req.user.role === 'acheteur' && !commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir ce paiement'
      });
    }

    if (req.user.role === 'boutique') {
      const boutique = await Boutique.findOne({ gerant: req.user.id });
      if (!boutique || !commande.boutique.equals(boutique._id)) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'êtes pas autorisé à voir ce paiement'
        });
      }
    }

    res.status(200).json({
      success: true,
      paiement
    });
  } catch (error) {
    console.error('Erreur obtention paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mettre à jour le statut d'un paiement
exports.mettreAJourStatutPaiement = async (req, res) => {
  try {
    const { statut_paiement, details_paiement } = req.body;

    if (!statut_paiement || !['paye', 'echec', 'rembourse', 'partiel'].includes(statut_paiement)) {
      return res.status(400).json({
        success: false,
        message: 'Statut de paiement invalide'
      });
    }

    const paiement = await Paiement.findById(req.params.id)
      .populate('commande');

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier les permissions (admin seulement)
    if (req.user.role !== 'admin_centre') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce paiement'
      });
    }

    const ancienStatut = paiement.statut_paiement;
    
    // Mettre à jour le paiement
    paiement.statut_paiement = statut_paiement;
    
    if (statut_paiement === 'paye') {
      paiement.date_paiement = new Date();
    }
    
    if (details_paiement) {
      paiement.details_paiement = { ...paiement.details_paiement, ...details_paiement };
    }

    await paiement.save();

    // Ajouter une tentative
    paiement.tentatives.push({
      date: new Date(),
      montant: paiement.montant,
      statut: statut_paiement,
      message_erreur: statut_paiement === 'echec' ? 'Échec du paiement' : null,
      reference_tentative: `TENT-${Date.now()}`
    });

    await paiement.save();

    res.status(200).json({
      success: true,
      message: `Statut de paiement mis à jour: ${ancienStatut} -> ${statut_paiement}`,
      paiement
    });
  } catch (error) {
    console.error('Erreur mise à jour paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paiement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les paiements d'une commande
exports.obtenirPaiementsCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.commandeId);
    
    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier les permissions
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (req.user.role === 'acheteur' && !commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir ces paiements'
      });
    }

    if (req.user.role === 'boutique' && boutique && !commande.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir ces paiements'
      });
    }

    const paiements = await Paiement.find({ commande: commande._id })
      .sort({ date_creation: -1 });

    res.status(200).json({
      success: true,
      paiements
    });
  } catch (error) {
    console.error('Erreur paiements commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Obtenir tous les paiements
exports.obtenirTousPaiements = async (req, res) => {
  try {
    const { statut_paiement, methode_paiement, date_debut, date_fin, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    if (statut_paiement) {
      query.statut_paiement = statut_paiement;
    }
    
    if (methode_paiement) {
      query.methode_paiement = methode_paiement;
    }
    
    if (date_debut || date_fin) {
      query.date_creation = {};
      if (date_debut) {
        query.date_creation.$gte = new Date(date_debut);
      }
      if (date_fin) {
        query.date_fin = new Date(date_fin);
        query.date_fin.setHours(23, 59, 59, 999);
        query.date_creation.$lte = query.date_fin;
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: {
        path: 'commande',
        populate: [
          { path: 'client', select: 'nom prenom email' },
          { path: 'boutique', select: 'nom' }
        ]
      },
      sort: { date_creation: -1 }
    };
    
    const paiements = await Paiement.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...paiements
    });
  } catch (error) {
    console.error('Erreur tous paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paiements',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Créer un remboursement
exports.creerRemboursement = async (req, res) => {
  try {
    const { montant_rembourse, raison, reference_remboursement } = req.body;

    if (!montant_rembourse || montant_rembourse <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant de remboursement invalide'
      });
    }

    const paiement = await Paiement.findById(req.params.id);
    
    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    // Vérifier les permissions (admin seulement)
    if (req.user.role !== 'admin_centre') {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à effectuer un remboursement'
      });
    }

    // Vérifier que le paiement est payé
    if (paiement.statut_paiement !== 'paye') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les paiements payés peuvent être remboursés'
      });
    }

    // Vérifier que le montant ne dépasse pas le montant payé
    const totalRembourse = (paiement.informations_remboursement?.montant_rembourse || 0) + parseFloat(montant_rembourse);
    
    if (totalRembourse > paiement.montant) {
      return res.status(400).json({
        success: false,
        message: `Le montant total remboursé (${totalRembourse}) dépasse le montant du paiement (${paiement.montant})`
      });
    }

    // Mettre à jour les informations de remboursement
    paiement.informations_remboursement = {
      montant_rembourse: totalRembourse,
      date_remboursement: new Date(),
      raison: raison || 'Remboursement effectué',
      reference_remboursement: reference_remboursement || `REMBOURS-${Date.now()}`
    };

    // Mettre à jour le statut
    if (totalRembourse >= paiement.montant) {
      paiement.statut_paiement = 'rembourse';
    } else {
      paiement.statut_paiement = 'partiel';
    }

    await paiement.save();

    res.status(200).json({
      success: true,
      message: 'Remboursement effectué avec succès',
      paiement
    });
  } catch (error) {
    console.error('Erreur remboursement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du remboursement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};