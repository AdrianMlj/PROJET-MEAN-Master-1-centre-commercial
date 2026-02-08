const Boutique = require('../models/boutique.model');
const Produit = require('../models/produit.model');
const Commande = require('../models/commande.model');
const Utilisateur = require('../models/utilisateur.model');
const mongoose = require('mongoose');

// Statistiques globales (pour admin)
exports.statistiquesGlobales = async (req, res) => {
  try {
    const dateDebut = new Date();
    dateDebut.setMonth(dateDebut.getMonth() - 1); // 30 derniers jours

    // Statistiques de base
    const [
      totalBoutiques,
      boutiquesActives,
      totalAcheteurs,
      totalCommandes,
      chiffreAffairesTotal,
      commandesMois
    ] = await Promise.all([
      Boutique.countDocuments(),
      Boutique.countDocuments({ est_active: true }),
      Utilisateur.countDocuments({ 'role.nom_role': 'acheteur' }),
      Commande.countDocuments(),
      Commande.aggregate([
        { $match: { statut: 'livre' } },
        { $group: { _id: null, total: { $sum: '$total_commande' } } }
      ]),
      Commande.countDocuments({ 
        date_commande: { $gte: dateDebut } 
      })
    ]);

    // Boutique la plus active
    const boutiquePlusActive = await Commande.aggregate([
      { $match: { statut: 'livre' } },
      { $group: { 
        _id: '$boutique', 
        nombreCommandes: { $sum: 1 },
        chiffreAffaires: { $sum: '$total_commande' }
      }},
      { $sort: { nombreCommandes: -1 } },
      { $limit: 1 },
      { $lookup: {
        from: 'boutiques',
        localField: '_id',
        foreignField: '_id',
        as: 'boutique'
      }},
      { $unwind: '$boutique' }
    ]);

    // Produits les plus vendus
    const produitsPlusVendus = await Commande.aggregate([
      { $match: { statut: 'livre' } },
      { $lookup: {
        from: 'commandedetails',
        localField: '_id',
        foreignField: 'commande',
        as: 'details'
      }},
      { $unwind: '$details' },
      { $group: {
        _id: '$details.produit',
        quantiteVendue: { $sum: '$details.quantite' },
        chiffreAffaires: { $sum: '$details.sous_total' }
      }},
      { $sort: { quantiteVendue: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'produits',
        localField: '_id',
        foreignField: '_id',
        as: 'produit'
      }},
      { $unwind: '$produit' },
      { $project: {
        produit: '$produit.nom',
        quantiteVendue: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Évolution du chiffre d'affaires par jour (30 derniers jours)
    const evolutionCA = await Commande.aggregate([
      { 
        $match: { 
          statut: 'livre',
          date_commande: { $gte: dateDebut }
        } 
      },
      { 
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$date_commande' } 
          },
          chiffreAffaires: { $sum: '$total_commande' },
          nombreCommandes: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      statistiques: {
        totalBoutiques,
        boutiquesActives,
        totalAcheteurs,
        totalCommandes,
        commandesCeMois: commandesMois,
        chiffreAffairesTotal: chiffreAffairesTotal[0]?.total || 0,
        boutiquePlusActive: boutiquePlusActive[0] || null,
        produitsPlusVendus,
        evolutionCA
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Statistiques par boutique (pour les gérants)
exports.statistiquesBoutique = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour voir ses statistiques'
      });
    }

    const dateDebut = new Date();
    dateDebut.setMonth(dateDebut.getMonth() - 1); // 30 derniers jours

    // Statistiques générales de la boutique
    const [
      totalCommandes,
      commandesEnAttente,
      commandesEnPreparation,
      commandesLivrees,
      chiffreAffairesTotal,
      chiffreAffairesMois
    ] = await Promise.all([
      Commande.countDocuments({ boutique: boutique._id }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'en_attente' }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'en_preparation' }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'livre' }),
      Commande.aggregate([
        { $match: { boutique: boutique._id, statut: 'livre' } },
        { $group: { _id: null, total: { $sum: '$total_commande' } } }
      ]),
      Commande.aggregate([
        { 
          $match: { 
            boutique: boutique._id, 
            statut: 'livre',
            date_commande: { $gte: dateDebut }
          } 
        },
        { $group: { _id: null, total: { $sum: '$total_commande' } } }
      ])
    ]);

    // Produits les plus vendus de la boutique
    const produitsPlusVendus = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre'
        } 
      },
      { $lookup: {
        from: 'commandedetails',
        localField: '_id',
        foreignField: 'commande',
        as: 'details'
      }},
      { $unwind: '$details' },
      { $group: {
        _id: '$details.produit',
        quantiteVendue: { $sum: '$details.quantite' },
        chiffreAffaires: { $sum: '$details.sous_total' }
      }},
      { $sort: { quantiteVendue: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'produits',
        localField: '_id',
        foreignField: '_id',
        as: 'produit'
      }},
      { $unwind: '$produit' },
      { $project: {
        produit: '$produit.nom',
        quantiteVendue: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Évolution des ventes par jour
    const evolutionVentes = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre',
          date_commande: { $gte: dateDebut }
        } 
      },
      { 
        $group: {
          _id: { 
            $dateToString: { format: '%Y-%m-%d', date: '$date_commande' } 
          },
          chiffreAffaires: { $sum: '$total_commande' },
          nombreCommandes: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Clients les plus fidèles
    const clientsFideles = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre'
        } 
      },
      { 
        $group: {
          _id: '$client',
          nombreCommandes: { $sum: 1 },
          montantTotal: { $sum: '$total_commande' }
        }
      },
      { $sort: { montantTotal: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'utilisateurs',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }},
      { $unwind: '$client' },
      { $project: {
        client: { 
          nom: '$client.nom', 
          prenom: '$client.prenom',
          email: '$client.email'
        },
        nombreCommandes: 1,
        montantTotal: 1
      }}
    ]);

    res.status(200).json({
      success: true,
      boutique: {
        id: boutique._id,
        nom: boutique.nom
      },
      statistiques: {
        totalCommandes,
        commandesEnAttente,
        commandesEnPreparation,
        commandesLivrees,
        chiffreAffairesTotal: chiffreAffairesTotal[0]?.total || 0,
        chiffreAffairesMois: chiffreAffairesMois[0]?.total || 0,
        produitsPlusVendus,
        evolutionVentes,
        clientsFideles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de la boutique',
      error: error.message
    });
  }
};

// Statistiques des produits d'une boutique
exports.statistiquesProduitsBoutique = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour voir ces statistiques'
      });
    }

    const { tri = 'ventes', limite = 20 } = req.query;

    let sort = {};
    switch (tri) {
      case 'ventes':
        sort = { 'statistiques.nombre_ventes': -1 };
        break;
      case 'vues':
        sort = { 'statistiques.nombre_vues': -1 };
        break;
      case 'stock':
        sort = { 'quantite_stock': 1 };
        break;
      case 'prix':
        sort = { 'prix': -1 };
        break;
      default:
        sort = { 'statistiques.nombre_ventes': -1 };
    }

    const produits = await Produit.find({ boutique: boutique._id })
      .select('nom prix prix_promotion en_promotion quantite_stock statistiques images')
      .sort(sort)
      .limit(parseInt(limite));

    // Calculer les statistiques globales des produits
    const statistiquesProduits = await Produit.aggregate([
      { $match: { boutique: boutique._id } },
      { 
        $group: {
          _id: null,
          totalProduits: { $sum: 1 },
          produitsActifs: { 
            $sum: { $cond: [{ $eq: ['$est_actif', true] }, 1, 0] } 
          },
          produitsEnPromotion: { 
            $sum: { $cond: [{ $eq: ['$en_promotion', true] }, 1, 0] } 
          },
          stockTotal: { $sum: '$quantite_stock' },
          produitsFaibleStock: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $lte: ['$quantite_stock', '$seuil_alerte'] },
                    { $gt: ['$quantite_stock', 0] }
                  ] 
                }, 
                1, 
                0 
              ]
            }
          },
          produitsRuptureStock: {
            $sum: {
              $cond: [
                { $lte: ['$quantite_stock', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      produits,
      statistiques: statistiquesProduits[0] || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des produits',
      error: error.message
    });
  }
};