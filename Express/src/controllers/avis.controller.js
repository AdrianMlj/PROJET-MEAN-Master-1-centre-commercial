const Avis = require('../models/avis.model');
const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');
const Commande = require('../models/commande.model');

// Ajouter un avis sur un produit
exports.ajouterAvisProduit = async (req, res) => {
  try {
    const { produitId, note, commentaire, commandeId } = req.body;

    if (!produitId || !note || note < 1 || note > 5) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides. Note requise (1-5)'
      });
    }

    // Vérifier que le produit existe
    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur a acheté ce produit (via commande)
    if (commandeId) {
      const commande = await Commande.findOne({
        _id: commandeId,
        client: req.user.id,
        statut: 'livre'
      }).populate('details');

      if (!commande) {
        return res.status(403).json({
          success: false,
          message: 'Vous devez avoir acheté ce produit pour laisser un avis'
        });
      }

      // Vérifier que le produit est bien dans la commande
      const produitDansCommande = commande.details.some(detail => 
        detail.produit.toString() === produitId
      );

      if (!produitDansCommande) {
        return res.status(403).json({
          success: false,
          message: 'Ce produit n\'est pas dans votre commande'
        });
      }
    }

    // Vérifier si l'utilisateur a déjà laissé un avis sur ce produit
    const avisExistant = await Avis.findOne({
      produit: produitId,
      client: req.user.id
    });

    if (avisExistant) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis sur ce produit'
      });
    }

    // Créer l'avis
    const nouvelAvis = new Avis({
      produit: produitId,
      client: req.user.id,
      commande: commandeId,
      note,
      commentaire: commentaire || '',
      est_valide: true
    });

    await nouvelAvis.save();

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      avis: nouvelAvis
    });
  } catch (error) {
    console.error('Erreur ajout avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Ajouter un avis sur une boutique
exports.ajouterAvisBoutique = async (req, res) => {
  try {
    const { boutiqueId, note, commentaire } = req.body;

    if (!boutiqueId || !note || note < 1 || note > 5) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides. Note requise (1-5)'
      });
    }

    // Vérifier que la boutique existe
    const boutique = await Boutique.findById(boutiqueId);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Vérifier que l'utilisateur a commandé dans cette boutique
    const commande = await Commande.findOne({
      boutique: boutiqueId,
      client: req.user.id,
      statut: 'livre'
    });

    if (!commande) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez avoir commandé dans cette boutique pour laisser un avis'
      });
    }

    // Vérifier si l'utilisateur a déjà laissé un avis sur cette boutique
    const avisExistant = await Avis.findOne({
      boutique: boutiqueId,
      client: req.user.id
    });

    if (avisExistant) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà laissé un avis sur cette boutique'
      });
    }

    // Créer l'avis
    const nouvelAvis = new Avis({
      boutique: boutiqueId,
      client: req.user.id,
      note,
      commentaire: commentaire || '',
      est_valide: true
    });

    await nouvelAvis.save();

    res.status(201).json({
      success: true,
      message: 'Avis ajouté avec succès',
      avis: nouvelAvis
    });
  } catch (error) {
    console.error('Erreur ajout avis boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les avis d'un produit
exports.obtenirAvisProduit = async (req, res) => {
  try {
    const { page = 1, limit = 10, note, tri = 'recent' } = req.query;

    const query = { 
      produit: req.params.id,
      est_valide: true 
    };

    if (note) {
      query.note = parseInt(note);
    }

    let sort = {};
    switch (tri) {
      case 'recent':
        sort = { date_creation: -1 };
        break;
      case 'ancien':
        sort = { date_creation: 1 };
        break;
      case 'note_desc':
        sort = { note: -1 };
        break;
      case 'note_asc':
        sort = { note: 1 };
        break;
      case 'utile':
        sort = { 'likes': -1 };
        break;
      default:
        sort = { date_creation: -1 };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'nom prenom avatar_url' },
        { path: 'reponse.utilisateur', select: 'nom prenom' }
      ],
      sort
    };

    const avis = await Avis.paginate(query, options);

    // Calculer les statistiques des notes
    const statsNotes = await Avis.aggregate([
      { $match: { produit: req.params.id, est_valide: true } },
      { 
        $group: {
          _id: '$note',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const totalAvis = statsNotes.reduce((sum, stat) => sum + stat.count, 0);
    const moyenneNotes = statsNotes.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / (totalAvis || 1);

    // Répartition en pourcentage
    const repartition = {};
    for (let i = 1; i <= 5; i++) {
      const stat = statsNotes.find(s => s._id === i);
      repartition[i] = stat ? Math.round((stat.count / totalAvis) * 100) : 0;
    }

    res.status(200).json({
      success: true,
      avis,
      statistiques: {
        totalAvis,
        moyenneNotes: moyenneNotes.toFixed(1),
        repartition,
        statsNotes
      }
    });
  } catch (error) {
    console.error('Erreur avis produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les avis d'une boutique
exports.obtenirAvisBoutique = async (req, res) => {
  try {
    const { page = 1, limit = 10, note, tri = 'recent' } = req.query;

    const query = { 
      boutique: req.params.id,
      est_valide: true 
    };

    if (note) {
      query.note = parseInt(note);
    }

    let sort = {};
    switch (tri) {
      case 'recent':
        sort = { date_creation: -1 };
        break;
      case 'ancien':
        sort = { date_creation: 1 };
        break;
      case 'note_desc':
        sort = { note: -1 };
        break;
      case 'note_asc':
        sort = { note: 1 };
        break;
      default:
        sort = { date_creation: -1 };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'nom prenom avatar_url' },
        { path: 'reponse.utilisateur', select: 'nom prenom' }
      ],
      sort
    };

    const avis = await Avis.paginate(query, options);

    // Calculer les statistiques des notes
    const statsNotes = await Avis.aggregate([
      { $match: { boutique: req.params.id, est_valide: true } },
      { 
        $group: {
          _id: '$note',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const totalAvis = statsNotes.reduce((sum, stat) => sum + stat.count, 0);
    const moyenneNotes = statsNotes.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / (totalAvis || 1);

    res.status(200).json({
      success: true,
      avis,
      statistiques: {
        totalAvis,
        moyenneNotes: moyenneNotes.toFixed(1),
        statsNotes
      }
    });
  } catch (error) {
    console.error('Erreur avis boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Répondre à un avis
exports.repondreAvis = async (req, res) => {
  try {
    const { reponse } = req.body;

    if (!reponse || reponse.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La réponse ne peut pas être vide'
      });
    }

    const avis = await Avis.findById(req.params.id);
    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique concernée
    let boutiqueId = null;
    
    if (avis.boutique) {
      boutiqueId = avis.boutique;
    } else if (avis.produit) {
      const produit = await Produit.findById(avis.produit);
      if (produit) {
        boutiqueId = produit.boutique;
      }
    }

    if (!boutiqueId) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de déterminer la boutique'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !boutique._id.equals(boutiqueId)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à répondre à cet avis'
      });
    }

    // Ajouter la réponse
    avis.reponse = {
      texte: reponse,
      date: new Date(),
      utilisateur: req.user.id
    };

    await avis.save();

    res.status(200).json({
      success: true,
      message: 'Réponse ajoutée avec succès',
      avis
    });
  } catch (error) {
    console.error('Erreur réponse avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la réponse',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Signalement d'un avis
exports.signalerAvis = async (req, res) => {
  try {
    const { raison } = req.body;

    if (!raison || raison.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La raison du signalement est requise'
      });
    }

    const avis = await Avis.findById(req.params.id);
    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà signalé cet avis
    const dejaSignale = avis.signalements.some(s => 
      s.utilisateur.toString() === req.user.id
    );

    if (dejaSignale) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà signalé cet avis'
      });
    }

    // Ajouter le signalement
    avis.signalements.push({
      utilisateur: req.user.id,
      raison: raison,
      date: new Date()
    });

    await avis.save();

    res.status(200).json({
      success: true,
      message: 'Avis signalé avec succès',
      nombreSignalements: avis.signalements.length
    });
  } catch (error) {
    console.error('Erreur signalement avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du signalement de l\'avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Modérer un avis
exports.modererAvis = async (req, res) => {
  try {
    const { est_valide } = req.body;

    if (est_valide === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Le statut de validation est requis'
      });
    }

    const avis = await Avis.findById(req.params.id);
    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    avis.est_valide = est_valide;
    await avis.save();

    res.status(200).json({
      success: true,
      message: `Avis ${est_valide ? 'validé' : 'invalidé'} avec succès`,
      avis
    });
  } catch (error) {
    console.error('Erreur modération avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modération de l\'avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Aimer un avis
exports.aimerAvis = async (req, res) => {
  try {
    const avis = await Avis.findById(req.params.id);
    if (!avis) {
      return res.status(404).json({
        success: false,
        message: 'Avis non trouvé'
      });
    }

    // Vérifier si l'utilisateur a déjà aimé cet avis
    const index = avis.likes.indexOf(req.user.id);
    
    if (index === -1) {
      // Ajouter le like
      avis.likes.push(req.user.id);
    } else {
      // Retirer le like
      avis.likes.splice(index, 1);
    }

    await avis.save();

    res.status(200).json({
      success: true,
      message: index === -1 ? 'Avis aimé' : 'Like retiré',
      nombreLikes: avis.likes.length,
      aime: index === -1
    });
  } catch (error) {
    console.error('Erreur like avis:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du like de l\'avis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};