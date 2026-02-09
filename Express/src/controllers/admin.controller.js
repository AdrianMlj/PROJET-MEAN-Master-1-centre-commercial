const mongoose = require('mongoose');
const Boutique = require('../models/boutique.model');
const Utilisateur = require('../models/utilisateur.model');
const Commande = require('../models/commande.model');
const Produit = require('../models/produit.model');
const Paiement = require('../models/paiement.model');
const CategorieBoutique = require('../models/categorieBoutique.model');

// Dashboard admin
exports.dashboardAdmin = async (req, res) => {
  try {
    const maintenant = new Date();
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
    const debutSemaine = new Date(maintenant);
    debutSemaine.setDate(maintenant.getDate() - 7);
    const debut30Jours = new Date(maintenant);
    debut30Jours.setDate(maintenant.getDate() - 30);

    // Statistiques principales
    const [
      totalBoutiques,
      boutiquesActives,
      totalUtilisateurs,
      acheteursActifs,
      totalCommandes,
      commandesMois,
      commandesSemaine,
      totalProduits
    ] = await Promise.all([
      Boutique.countDocuments(),
      Boutique.countDocuments({ est_active: true }),
      Utilisateur.countDocuments(),
      Utilisateur.countDocuments({ est_actif: true, 'role.nom_role': 'acheteur' }),
      Commande.countDocuments(),
      Commande.countDocuments({ date_commande: { $gte: debutMois } }),
      Commande.countDocuments({ date_commande: { $gte: debutSemaine } }),
      Produit.countDocuments({ est_actif: true })
    ]);

    // Chiffre d'affaires
    const chiffreAffaires = await Commande.aggregate([
      { $match: { statut: 'livre', 'informations_paiement.statut': 'paye' } },
      { $group: { 
        _id: null, 
        total: { $sum: '$total_commande' },
        total_mois: { 
          $sum: { 
            $cond: [{ $gte: ['$date_commande', debutMois] }, '$total_commande', 0] 
          } 
        },
        total_semaine: { 
          $sum: { 
            $cond: [{ $gte: ['$date_commande', debutSemaine] }, '$total_commande', 0] 
          } 
        }
      }}
    ]);

    // Statistiques des commandes par statut
    const statsCommandes = await Commande.aggregate([
      { $group: { 
        _id: '$statut', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);

    // Boutiques les plus performantes
    const boutiquesPerformantes = await Commande.aggregate([
      { $match: { statut: 'livre', 'informations_paiement.statut': 'paye' } },
      { $group: { 
        _id: '$boutique', 
        nombreCommandes: { $sum: 1 },
        chiffreAffaires: { $sum: '$total_commande' }
      }},
      { $sort: { chiffreAffaires: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'boutiques',
        localField: '_id',
        foreignField: '_id',
        as: 'boutique'
      }},
      { $unwind: '$boutique' },
      { $project: {
        boutique: '$boutique.nom',
        logo_url: '$boutique.logo_url',
        nombreCommandes: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Produits les plus vendus
    const produitsVendus = await Commande.aggregate([
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
      { $limit: 10 },
      { $lookup: {
        from: 'produits',
        localField: '_id',
        foreignField: '_id',
        as: 'produit'
      }},
      { $unwind: '$produit' },
      { $lookup: {
        from: 'boutiques',
        localField: 'produit.boutique',
        foreignField: '_id',
        as: 'boutique'
      }},
      { $unwind: '$boutique' },
      { $project: {
        produit: '$produit.nom',
        boutique: '$boutique.nom',
        quantiteVendue: 1,
        chiffreAffaires: 1
      }}
    ]);

    // Évolution du chiffre d'affaires (30 derniers jours)
    const evolutionCA = await Commande.aggregate([
      { 
        $match: { 
          statut: 'livre',
          'informations_paiement.statut': 'paye',
          date_commande: { $gte: debut30Jours }
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

    // Alertes et notifications
    const alertes = await Promise.all([
      Boutique.countDocuments({ est_active: false }),
      Produit.countDocuments({ 
        quantite_stock: 0,
        est_actif: true 
      }),
      Produit.countDocuments({ 
        $expr: { $lte: ['$quantite_stock', '$seuil_alerte'] },
        quantite_stock: { $gt: 0 },
        est_actif: true 
      }),
      Commande.countDocuments({ 
        statut: 'en_attente',
        date_commande: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // plus de 24h
      })
    ]);

    // Catégories les plus populaires
    const categoriesPopulaires = await Boutique.aggregate([
      { $match: { est_active: true } },
      { $group: { 
        _id: '$categorie', 
        nombreBoutiques: { $sum: 1 } 
      }},
      { $sort: { nombreBoutiques: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'categorieboutiques',
        localField: '_id',
        foreignField: '_id',
        as: 'categorie'
      }},
      { $unwind: '$categorie' },
      { $project: {
        categorie: '$categorie.nom_categorie',
        nombreBoutiques: 1
      }}
    ]);

    // Dernières activités
    const dernieresActivites = await Promise.all([
      Commande.find()
        .sort({ date_commande: -1 })
        .limit(10)
        .populate('client', 'nom prenom')
        .populate('boutique', 'nom'),
      Utilisateur.find()
        .sort({ date_creation: -1 })
        .limit(10)
        .populate('role', 'nom_role'),
      Boutique.find()
        .sort({ date_creation: -1 })
        .limit(10)
        .populate('categorie', 'nom_categorie')
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        statistiques: {
          boutiques: {
            total: totalBoutiques,
            actives: boutiquesActives,
            inactives: totalBoutiques - boutiquesActives
          },
          utilisateurs: {
            total: totalUtilisateurs,
            acheteurs_actifs: acheteursActifs
          },
          commandes: {
            total: totalCommandes,
            ce_mois: commandesMois,
            cette_semaine: commandesSemaine
          },
          produits: {
            total: totalProduits
          },
          chiffre_affaires: {
            total: chiffreAffaires[0]?.total || 0,
            ce_mois: chiffreAffaires[0]?.total_mois || 0,
            cette_semaine: chiffreAffaires[0]?.total_semaine || 0
          }
        },
        repartition_commandes: statsCommandes,
        boutiques_performantes: boutiquesPerformantes,
        produits_vendus: produitsVendus,
        evolution_ca: evolutionCA,
        categories_populaires: categoriesPopulaires,
        alertes: {
          boutiques_inactives: alertes[0],
          produits_rupture: alertes[1],
          produits_faible_stock: alertes[2],
          commandes_en_attente: alertes[3]
        },
        dernieres_activites: {
          commandes: dernieresActivites[0],
          utilisateurs: dernieresActivites[1],
          boutiques: dernieresActivites[2]
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

// Gérer les paramètres du centre commercial
exports.gererParametresCentre = async (req, res) => {
  try {
    const { 
      nom_centre, 
      description, 
      contact_email, 
      contact_telephone,
      horaires_ouverture,
      adresse,
      frais_livraison_par_defaut,
      seuil_livraison_gratuite,
      taux_tva,
      maintenance_mode
    } = req.body;

    // Ici, vous pourriez stocker ces paramètres dans une collection dédiée
    // Pour l'exemple, nous allons simuler une collection "ParametresCentre"
    
    const parametres = {
      nom_centre: nom_centre || "Centre Commercial M1P13",
      description: description || "Le centre commercial numérique",
      contact_email: contact_email || "contact@centrecommercial.com",
      contact_telephone: contact_telephone || "+33 1 23 45 67 89",
      horaires_ouverture: horaires_ouverture || "Lundi - Vendredi: 9h-20h, Samedi: 9h-21h, Dimanche: 10h-18h",
      adresse: adresse || {
        rue: "123 Avenue du Commerce",
        ville: "Paris",
        code_postal: "75000",
        pays: "France"
      },
      frais_livraison_par_defaut: frais_livraison_par_defaut || 5,
      seuil_livraison_gratuite: seuil_livraison_gratuite || 50,
      taux_tva: taux_tva || 20,
      maintenance_mode: maintenance_mode || false,
      date_modification: new Date(),
      modifie_par: req.user.id
    };

    // Dans une vraie implémentation, vous sauvegarderiez ces paramètres dans la base de données
    // Exemple: await ParametresCentre.findOneAndUpdate({}, parametres, { upsert: true, new: true });

    res.status(200).json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      parametres
    });
  } catch (error) {
    console.error('Erreur gestion paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérer les catégories de boutiques (CRUD étendu)
exports.gererCategoriesBoutique = async (req, res) => {
  try {
    const { action, nom_categorie, description, icone, est_active, ordre_affichage } = req.body;

    if (action === 'creer') {
      // Créer une nouvelle catégorie
      const nouvelleCategorie = new CategorieBoutique({
        nom_categorie,
        description,
        icone: icone || '🛍️',
        est_active: est_active !== undefined ? est_active : true,
        ordre_affichage: ordre_affichage || 0
      });

      await nouvelleCategorie.save();

      return res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        categorie: nouvelleCategorie
      });
    } else if (action === 'modifier' && req.params.id) {
      // Modifier une catégorie existante
      const categorie = await CategorieBoutique.findById(req.params.id);
      
      if (!categorie) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      if (nom_categorie) categorie.nom_categorie = nom_categorie;
      if (description !== undefined) categorie.description = description;
      if (icone !== undefined) categorie.icone = icone;
      if (est_active !== undefined) categorie.est_active = est_active;
      if (ordre_affichage !== undefined) categorie.ordre_affichage = ordre_affichage;

      await categorie.save();

      return res.status(200).json({
        success: true,
        message: 'Catégorie mise à jour avec succès',
        categorie
      });
    } else if (action === 'supprimer' && req.params.id) {
      // Supprimer une catégorie
      const categorie = await CategorieBoutique.findById(req.params.id);
      
      if (!categorie) {
        return res.status(404).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }

      // Vérifier si des boutiques utilisent cette catégorie
      const boutiquesAvecCategorie = await Boutique.countDocuments({ categorie: categorie._id });
      
      if (boutiquesAvecCategorie > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossible de supprimer cette catégorie car ${boutiquesAvecCategorie} boutique(s) l'utilisent`
        });
      }

      await categorie.deleteOne();

      return res.status(200).json({
        success: true,
        message: 'Catégorie supprimée avec succès'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action non valide ou paramètres manquants'
      });
    }
  } catch (error) {
    console.error('Erreur gestion catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion des catégories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gestion des rôles et permissions
exports.gererRolesPermissions = async (req, res) => {
  try {
    const Role = require('../models/role.model');
    const { action, role_id, permissions, description } = req.body;

    if (action === 'ajouter_permission') {
      const role = await Role.findById(role_id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Rôle non trouvé'
        });
      }

      if (permissions && Array.isArray(permissions)) {
        // Ajouter les nouvelles permissions sans doublons
        permissions.forEach(permission => {
          if (!role.permissions.includes(permission)) {
            role.permissions.push(permission);
          }
        });
      }

      await role.save();

      return res.status(200).json({
        success: true,
        message: 'Permissions ajoutées avec succès',
        role
      });
    } else if (action === 'retirer_permission') {
      const role = await Role.findById(role_id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Rôle non trouvé'
        });
      }

      if (permissions && Array.isArray(permissions)) {
        // Retirer les permissions spécifiées
        role.permissions = role.permissions.filter(
          permission => !permissions.includes(permission)
        );
      }

      await role.save();

      return res.status(200).json({
        success: true,
        message: 'Permissions retirées avec succès',
        role
      });
    } else if (action === 'modifier_description' && role_id && description) {
      const role = await Role.findById(role_id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Rôle non trouvé'
        });
      }

      role.description = description;
      await role.save();

      return res.status(200).json({
        success: true,
        message: 'Description modifiée avec succès',
        role
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action non valide ou paramètres manquants'
      });
    }
  } catch (error) {
    console.error('Erreur gestion rôles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion des rôles et permissions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gestion des rapports et exports
exports.genererRapports = async (req, res) => {
  try {
    const { type, date_debut, date_fin, format } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Type de rapport requis'
      });
    }

    const debut = date_debut ? new Date(date_debut) : new Date();
    const fin = date_fin ? new Date(date_fin) : new Date();
    
    if (date_debut) debut.setHours(0, 0, 0, 0);
    if (date_fin) fin.setHours(23, 59, 59, 999);

    let rapport;

    switch (type) {
      case 'commandes':
        rapport = await genererRapportCommandes(debut, fin);
        break;
      case 'ventes':
        rapport = await genererRapportVentes(debut, fin);
        break;
      case 'boutiques':
        rapport = await genererRapportBoutiques(debut, fin);
        break;
      case 'produits':
        rapport = await genererRapportProduits(debut, fin);
        break;
      case 'utilisateurs':
        rapport = await genererRapportUtilisateurs(debut, fin);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Type de rapport non valide'
        });
    }

    // Formatage du rapport
    let resultat;
    if (format === 'csv') {
      resultat = formaterEnCSV(rapport);
    } else {
      resultat = rapport; // Format JSON par défaut
    }

    res.status(200).json({
      success: true,
      message: 'Rapport généré avec succès',
      rapport: resultat,
      metadata: {
        type,
        date_debut: debut,
        date_fin: fin,
        format: format || 'json',
        generer_le: new Date()
      }
    });
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fonctions auxiliaires pour les rapports
async function genererRapportCommandes(debut, fin) {
  const commandes = await Commande.find({
    date_commande: { $gte: debut, $lte: fin }
  })
  .populate('client', 'nom prenom email')
  .populate('boutique', 'nom')
  .sort({ date_commande: -1 });

  const stats = await Commande.aggregate([
    { $match: { date_commande: { $gte: debut, $lte: fin } } },
    { 
      $group: {
        _id: '$statut',
        count: { $sum: 1 },
        total: { $sum: '$total_commande' }
      }
    }
  ]);

  return {
    periode: { debut, fin },
    total_commandes: commandes.length,
    commandes: commandes.map(c => ({
      id: c._id,
      numero: c.numero_commande,
      date: c.date_commande,
      client: c.client ? `${c.client.nom} ${c.client.prenom}` : 'Inconnu',
      boutique: c.boutique?.nom || 'Inconnue',
      statut: c.statut,
      total: c.total_commande,
      paiement: c.informations_paiement.statut
    })),
    statistiques: stats
  };
}

async function genererRapportVentes(debut, fin) {
  const ventes = await Commande.aggregate([
    { 
      $match: { 
        statut: 'livre',
        'informations_paiement.statut': 'paye',
        date_commande: { $gte: debut, $lte: fin }
      } 
    },
    { 
      $group: {
        _id: { 
          $dateToString: { format: '%Y-%m-%d', date: '$date_commande' } 
        },
        nombre_commandes: { $sum: 1 },
        chiffre_affaires: { $sum: '$total_commande' },
        moyenne_panier: { $avg: '$total_commande' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const total = await Commande.aggregate([
    { 
      $match: { 
        statut: 'livre',
        'informations_paiement.statut': 'paye',
        date_commande: { $gte: debut, $lte: fin }
      } 
    },
    { 
      $group: {
        _id: null,
        total_commandes: { $sum: 1 },
        total_chiffre_affaires: { $sum: '$total_commande' },
        moyenne_panier_total: { $avg: '$total_commande' }
      }
    }
  ]);

  return {
    periode: { debut, fin },
    ventes_par_jour: ventes,
    total: total[0] || {}
  };
}

async function genererRapportBoutiques(debut, fin) {
  const boutiques = await Boutique.aggregate([
    { $lookup: {
      from: 'commandes',
      let: { boutiqueId: '$_id' },
      pipeline: [
        { 
          $match: { 
            $expr: { $eq: ['$boutique', '$$boutiqueId'] },
            date_commande: { $gte: debut, $lte: fin },
            statut: 'livre',
            'informations_paiement.statut': 'paye'
          }
        },
        { 
          $group: {
            _id: null,
            nombre_commandes: { $sum: 1 },
            chiffre_affaires: { $sum: '$total_commande' }
          }
        }
      ],
      as: 'stats'
    }},
    { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
    { $project: {
      nom: 1,
      categorie: 1,
      est_active: 1,
      date_creation: 1,
      nombre_commandes: '$stats.nombre_commandes' || 0,
      chiffre_affaires: '$stats.chiffre_affaires' || 0,
      note_moyenne: '$statistiques.note_moyenne',
      nombre_avis: '$statistiques.nombre_avis'
    }},
    { $sort: { chiffre_affaires: -1 } }
  ]);

  return {
    periode: { debut, fin },
    nombre_boutiques: boutiques.length,
    boutiques_actives: boutiques.filter(b => b.est_active).length,
    boutiques: boutiques
  };
}

async function genererRapportProduits(debut, fin) {
  const produits = await Commande.aggregate([
    { 
      $match: { 
        statut: 'livre',
        'informations_paiement.statut': 'paye',
        date_commande: { $gte: debut, $lte: fin }
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
      nom_produit: { $first: '$details.nom_produit' },
      quantite_vendue: { $sum: '$details.quantite' },
      chiffre_affaires: { $sum: '$details.sous_total' }
    }},
    { $sort: { quantite_vendue: -1 } },
    { $limit: 50 },
    { $lookup: {
      from: 'produits',
      localField: '_id',
      foreignField: '_id',
      as: 'produit'
    }},
    { $unwind: { path: '$produit', preserveNullAndEmptyArrays: true } },
    { $project: {
      nom: '$produit.nom' || '$nom_produit',
      boutique: '$produit.boutique',
      prix: '$produit.prix',
      quantite_vendue: 1,
      chiffre_affaires: 1,
      prix_moyen: { $divide: ['$chiffre_affaires', '$quantite_vendue'] }
    }}
  ]);

  return {
    periode: { debut, fin },
    nombre_produits_vendus: produits.length,
    total_quantite_vendue: produits.reduce((sum, p) => sum + p.quantite_vendue, 0),
    total_chiffre_affaires: produits.reduce((sum, p) => sum + p.chiffre_affaires, 0),
    produits: produits
  };
}

async function genererRapportUtilisateurs(debut, fin) {
  const utilisateurs = await Utilisateur.aggregate([
    { $match: { date_creation: { $gte: debut, $lte: fin } } },
    { $lookup: {
      from: 'roles',
      localField: 'role',
      foreignField: '_id',
      as: 'role'
    }},
    { $unwind: '$role' },
    { $lookup: {
      from: 'commandes',
      let: { userId: '$_id' },
      pipeline: [
        { 
          $match: { 
            $expr: { $eq: ['$client', '$$userId'] },
            date_commande: { $gte: debut, $lte: fin }
          }
        },
        { 
          $group: {
            _id: null,
            nombre_commandes: { $sum: 1 },
            total_depense: { $sum: '$total_commande' }
          }
        }
      ],
      as: 'stats'
    }},
    { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
    { $project: {
      nom: 1,
      prenom: 1,
      email: 1,
      role: '$role.nom_role',
      date_creation: 1,
      est_actif: 1,
      nombre_commandes: '$stats.nombre_commandes' || 0,
      total_depense: '$stats.total_depense' || 0
    }},
    { $sort: { date_creation: -1 } }
  ]);

  const statsRole = await Utilisateur.aggregate([
    { $match: { date_creation: { $gte: debut, $lte: fin } } },
    { $lookup: {
      from: 'roles',
      localField: 'role',
      foreignField: '_id',
      as: 'role'
    }},
    { $unwind: '$role' },
    { $group: {
      _id: '$role.nom_role',
      count: { $sum: 1 }
    }}
  ]);

  return {
    periode: { debut, fin },
    nombre_utilisateurs: utilisateurs.length,
    repartition_roles: statsRole,
    utilisateurs: utilisateurs
  };
}

function formaterEnCSV(rapport) {
  // Implémentation simplifiée de formatage CSV
  // Dans une vraie implémentation, vous utiliseriez une bibliothèque comme json2csv
  return JSON.stringify(rapport);
}