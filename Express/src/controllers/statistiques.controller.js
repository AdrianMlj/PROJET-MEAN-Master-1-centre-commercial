const Boutique = require('../models/boutique.model');
const Produit = require('../models/produit.model');
const Commande = require('../models/commande.model');
const Utilisateur = require('../models/utilisateur.model');
const Paiement = require('../models/paiement.model');
const mongoose = require('mongoose');

// Statistiques globales (admin)
exports.statistiquesGlobales = async (req, res) => {
  try {
    const dateDebutMois = new Date();
    dateDebutMois.setDate(1);
    dateDebutMois.setHours(0, 0, 0, 0);

    const dateDebutSemaine = new Date();
    dateDebutSemaine.setDate(dateDebutSemaine.getDate() - 7);

    // Statistiques de base
    const [
      totalBoutiques,
      boutiquesActives,
      totalAcheteurs,
      totalCommandes,
      commandesMois,
      commandesSemaine
    ] = await Promise.all([
      Boutique.countDocuments(),
      Boutique.countDocuments({ est_active: true }),
      Utilisateur.countDocuments({ 'role.nom_role': 'acheteur' }),
      Commande.countDocuments(),
      Commande.countDocuments({ 
        date_commande: { $gte: dateDebutMois } 
      }),
      Commande.countDocuments({ 
        date_commande: { $gte: dateDebutSemaine } 
      })
    ]);

    // Chiffre d'affaires total et du mois
    const chiffreAffaires = await Commande.aggregate([
      { $match: { statut: 'livre', 'informations_paiement.statut': 'paye' } },
      { $group: { 
        _id: null, 
        total: { $sum: '$total_commande' },
        total_mois: { 
          $sum: { 
            $cond: [{ $gte: ['$date_commande', dateDebutMois] }, '$total_commande', 0] 
          } 
        }
      }}
    ]);

    // Boutique la plus active
    const boutiquePlusActive = await Commande.aggregate([
      { $match: { statut: 'livre', 'informations_paiement.statut': 'paye' } },
      { $group: { 
        _id: '$boutique', 
        nombreCommandes: { $sum: 1 },
        chiffreAffaires: { $sum: '$total_commande' }
      }},
      { $sort: { chiffreAffaires: -1 } },
      { $limit: 1 },
      { $lookup: {
        from: 'boutiques',
        localField: '_id',
        foreignField: '_id',
        as: 'boutique'
      }},
      { $unwind: '$boutique' },
      { $project: {
        boutique: '$boutique.nom',
        nombreCommandes: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Produits les plus vendus
    const produitsPlusVendus = await Commande.aggregate([
      { $match: { statut: 'livre', 'informations_paiement.statut': 'paye' } },
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
        boutique: '$produit.boutique',
        quantiteVendue: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Évolution du chiffre d'affaires par jour (30 derniers jours)
    const dateDebut30Jours = new Date();
    dateDebut30Jours.setDate(dateDebut30Jours.getDate() - 30);

    const evolutionCA = await Commande.aggregate([
      { 
        $match: { 
          statut: 'livre',
          'informations_paiement.statut': 'paye',
          date_commande: { $gte: dateDebut30Jours }
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

    // Statistiques des paiements
    const statistiquesPaiements = await Paiement.aggregate([
      { 
        $group: {
          _id: '$statut_paiement',
          count: { $sum: 1 },
          total: { $sum: '$montant' }
        }
      }
    ]);

    // Répartition des commandes par statut
    const repartitionStatuts = await Commande.aggregate([
      { 
        $group: {
          _id: '$statut',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      statistiques: {
        totalBoutiques,
        boutiquesActives,
        totalAcheteurs,
        totalCommandes,
        commandesCeMois: commandesMois,
        commandesCetteSemaine: commandesSemaine,
        chiffreAffairesTotal: chiffreAffaires[0]?.total || 0,
        chiffreAffairesMois: chiffreAffaires[0]?.total_mois || 0,
        boutiquePlusActive: boutiquePlusActive[0] || null,
        produitsPlusVendus,
        evolutionCA,
        statistiquesPaiements,
        repartitionStatuts
      }
    });
  } catch (error) {
    console.error('Erreur statistiques globales:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Statistiques par boutique (gérant)
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

    const dateDebutMois = new Date();
    dateDebutMois.setDate(1);
    dateDebutMois.setHours(0, 0, 0, 0);

    const dateDebutSemaine = new Date();
    dateDebutSemaine.setDate(dateDebutSemaine.getDate() - 7);

    // Statistiques générales de la boutique
    const [
      totalCommandes,
      commandesEnAttente,
      commandesEnPreparation,
      commandesLivrees,
      commandesMois,
      commandesSemaine,
      produitsActifs
    ] = await Promise.all([
      Commande.countDocuments({ boutique: boutique._id }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'en_attente' }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'en_preparation' }),
      Commande.countDocuments({ boutique: boutique._id, statut: 'livre' }),
      Commande.countDocuments({ 
        boutique: boutique._id,
        date_commande: { $gte: dateDebutMois } 
      }),
      Commande.countDocuments({ 
        boutique: boutique._id,
        date_commande: { $gte: dateDebutSemaine } 
      }),
      Produit.countDocuments({ boutique: boutique._id, est_actif: true })
    ]);

    // Chiffre d'affaires
    const chiffreAffaires = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre',
          'informations_paiement.statut': 'paye'
        } 
      },
      { $group: { 
        _id: null, 
        total: { $sum: '$total_commande' },
        total_mois: { 
          $sum: { 
            $cond: [{ $gte: ['$date_commande', dateDebutMois] }, '$total_commande', 0] 
          } 
        },
        total_semaine: { 
          $sum: { 
            $cond: [{ $gte: ['$date_commande', dateDebutSemaine] }, '$total_commande', 0] 
          } 
        }
      }}
    ]);

    // Produits les plus vendus
    const produitsPlusVendus = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre',
          'informations_paiement.statut': 'paye'
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

    // Évolution des ventes par jour (30 derniers jours)
    const dateDebut30Jours = new Date();
    dateDebut30Jours.setDate(dateDebut30Jours.getDate() - 30);

    const evolutionVentes = await Commande.aggregate([
      { 
        $match: { 
          boutique: boutique._id,
          statut: 'livre',
          'informations_paiement.statut': 'paye',
          date_commande: { $gte: dateDebut30Jours }
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
          statut: 'livre',
          'informations_paiement.statut': 'paye'
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

    // Statistiques des produits
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
      boutique: {
        id: boutique._id,
        nom: boutique.nom
      },
      statistiques: {
        totalCommandes,
        commandesEnAttente,
        commandesEnPreparation,
        commandesLivrees,
        commandesCeMois: commandesMois,
        commandesCetteSemaine: commandesSemaine,
        produitsActifs,
        chiffreAffairesTotal: chiffreAffaires[0]?.total || 0,
        chiffreAffairesMois: chiffreAffaires[0]?.total_mois || 0,
        chiffreAffairesSemaine: chiffreAffaires[0]?.total_semaine || 0,
        produitsPlusVendus,
        evolutionVentes,
        clientsFideles,
        statistiquesProduits: statistiquesProduits[0] || {}
      }
    });
  } catch (error) {
    console.error('Erreur statistiques boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    const { tri = 'ventes', limite = 20, categorie } = req.query;

    let match = { boutique: boutique._id };
    
    if (categorie && categorie !== 'tous') {
      match.categorie_produit = mongoose.Types.ObjectId(categorie);
    }

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
      case 'note':
        sort = { 'statistiques.note_moyenne': -1 };
        break;
      case 'promotion':
        sort = { 'en_promotion': -1, 'prix_promotion': 1 };
        break;
      default:
        sort = { 'statistiques.nombre_ventes': -1 };
    }

    const produits = await Produit.find(match)
      .select('nom prix prix_promotion en_promotion quantite_stock statistiques images categorie_produit')
      .populate('categorie_produit', 'nom_categorie')
      .sort(sort)
      .limit(parseInt(limite));

    // Statistiques détaillées
    const statistiquesDetaillees = await Produit.aggregate([
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
          valeurStockTotal: { $sum: { $multiply: ['$prix', '$quantite_stock'] } },
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
          },
          totalVentes: { $sum: '$statistiques.nombre_ventes' },
          totalVues: { $sum: '$statistiques.nombre_vues' },
          moyenneNote: { $avg: '$statistiques.note_moyenne' }
        }
      }
    ]);

    // Répartition par catégorie
    const repartitionCategories = await Produit.aggregate([
      { $match: { boutique: boutique._id } },
      { $group: {
        _id: '$categorie_produit',
        count: { $sum: 1 },
        totalStock: { $sum: '$quantite_stock' },
        totalVentes: { $sum: '$statistiques.nombre_ventes' }
      }},
      { $lookup: {
        from: 'categorieproduits',
        localField: '_id',
        foreignField: '_id',
        as: 'categorie'
      }},
      { $unwind: { path: '$categorie', preserveNullAndEmptyArrays: true } },
      { $project: {
        categorie: '$categorie.nom_categorie',
        count: 1,
        totalStock: 1,
        totalVentes: 1
      }},
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      produits,
      statistiques: statistiquesDetaillees[0] || {},
      repartitionCategories
    });
  } catch (error) {
    console.error('Erreur statistiques produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Dashboard admin
exports.dashboardAdmin = async (req, res) => {
  try {
    // Statistiques récentes (7 derniers jours)
    const dateDebut7Jours = new Date();
    dateDebut7Jours.setDate(dateDebut7Jours.getDate() - 7);

    const [
      nouvellesCommandes,
      nouveauxUtilisateurs,
      nouvellesBoutiques,
      commandesRecent,
      utilisateursRecent,
      produitsRecent
    ] = await Promise.all([
      Commande.countDocuments({ date_commande: { $gte: dateDebut7Jours } }),
      Utilisateur.countDocuments({ date_creation: { $gte: dateDebut7Jours } }),
      Boutique.countDocuments({ date_creation: { $gte: dateDebut7Jours } }),
      Commande.find({ date_commande: { $gte: dateDebut7Jours } })
        .populate('boutique', 'nom')
        .populate('client', 'nom prenom')
        .sort({ date_commande: -1 })
        .limit(10),
      Utilisateur.find({ date_creation: { $gte: dateDebut7Jours } })
        .populate('role', 'nom_role')
        .sort({ date_creation: -1 })
        .limit(10),
      Produit.find({ date_creation: { $gte: dateDebut7Jours } })
        .populate('boutique', 'nom')
        .sort({ date_creation: -1 })
        .limit(10)
    ]);

    // Chiffre d'affaires récent
    const chiffreAffairesRecent = await Commande.aggregate([
      { 
        $match: { 
          statut: 'livre',
          'informations_paiement.statut': 'paye',
          date_commande: { $gte: dateDebut7Jours }
        } 
      },
      { $group: { 
        _id: null, 
        total: { $sum: '$total_commande' }
      }}
    ]);

    // Alertes (boutiques inactives, produits en rupture, etc.)
    const boutiquesInactives = await Boutique.countDocuments({ est_active: false });
    const produitsRupture = await Produit.countDocuments({ 
      quantite_stock: 0,
      est_actif: true 
    });
    const commandesEnAttente = await Commande.countDocuments({ statut: 'en_attente' });

    res.status(200).json({
      success: true,
      dashboard: {
        statistiquesRecentes: {
          nouvellesCommandes,
          nouveauxUtilisateurs,
          nouvellesBoutiques,
          chiffreAffairesRecent: chiffreAffairesRecent[0]?.total || 0
        },
        alertes: {
          boutiquesInactives,
          produitsRupture,
          commandesEnAttente
        },
        recent: {
          commandes: commandesRecent,
          utilisateurs: utilisateursRecent,
          produits: produitsRecent
        }
      }
    });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};