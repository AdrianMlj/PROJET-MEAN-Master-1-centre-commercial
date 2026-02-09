const Utilisateur = require('../models/utilisateur.model');
const Role = require('../models/role.model');
const Boutique = require('../models/boutique.model');
const { hasher } = require('../utils/password.util');

// Admin: Lister tous les utilisateurs
exports.listerUtilisateurs = async (req, res) => {
  try {
    const { role, est_actif, page = 1, limit = 10, recherche } = req.query;
    
    const query = {};
    
    // Filtre par rôle
    if (role) {
      const roleTrouve = await Role.findOne({ nom_role: role });
      if (roleTrouve) {
        query.role = roleTrouve._id;
      }
    }
    
    // Filtre par statut
    if (est_actif !== undefined) {
      query.est_actif = est_actif === 'true';
    }
    
    // Recherche
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { prenom: { $regex: recherche, $options: 'i' } },
        { email: { $regex: recherche, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-mot_de_passe_hash',
      populate: [
        { path: 'role', select: 'nom_role description' },
        { path: 'boutique_associee', select: 'nom est_active' }
      ],
      sort: { date_creation: -1 }
    };
    
    const utilisateurs = await Utilisateur.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...utilisateurs
    });
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Créer un utilisateur
exports.creerUtilisateur = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, telephone, role, est_actif } = req.body;

    // Validation
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (!mot_de_passe || mot_de_passe.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    if (!nom || nom.length < 2 || nom.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Le nom doit contenir entre 2 et 50 caractères'
      });
    }

    if (!role || !['admin_centre', 'boutique', 'acheteur'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const utilisateurExistant = await Utilisateur.findOne({ email });
    if (utilisateurExistant) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Trouver le rôle
    const roleTrouve = await Role.findOne({ nom_role: role });
    if (!roleTrouve) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Hacher le mot de passe
    const motDePasseHash = await hasher(mot_de_passe);

    // Créer l'utilisateur
    const nouvelUtilisateur = new Utilisateur({
      email,
      mot_de_passe_hash: motDePasseHash,
      nom,
      prenom: prenom || '',
      telephone: telephone || '',
      role: roleTrouve._id,
      est_actif: est_actif !== undefined ? est_actif : true
    });

    await nouvelUtilisateur.save();

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      utilisateur: {
        id: nouvelUtilisateur._id,
        email: nouvelUtilisateur.email,
        nom: nouvelUtilisateur.nom,
        prenom: nouvelUtilisateur.prenom,
        telephone: nouvelUtilisateur.telephone,
        role: roleTrouve.nom_role,
        est_actif: nouvelUtilisateur.est_actif
      }
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Obtenir un utilisateur
exports.obtenirUtilisateur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.id)
      .select('-mot_de_passe_hash')
      .populate('role')
      .populate('boutique_associee');

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      utilisateur
    });
  } catch (error) {
    console.error('Erreur obtention utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Modifier un utilisateur
exports.modifierUtilisateur = async (req, res) => {
  try {
    const { nom, prenom, telephone, est_actif, boutique_associee } = req.body;

    const utilisateur = await Utilisateur.findById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les informations
    if (nom && nom.length >= 2 && nom.length <= 50) utilisateur.nom = nom;
    if (prenom !== undefined) utilisateur.prenom = prenom;
    if (telephone !== undefined) utilisateur.telephone = telephone;
    
    if (est_actif !== undefined) {
      utilisateur.est_actif = est_actif;
    }
    
    if (boutique_associee !== undefined) {
      if (boutique_associee === null) {
        utilisateur.boutique_associee = null;
      } else {
        const boutique = await Boutique.findById(boutique_associee);
        if (!boutique) {
          return res.status(400).json({
            success: false,
            message: 'Boutique non trouvée'
          });
        }
        utilisateur.boutique_associee = boutique._id;
      }
    }

    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      utilisateur: {
        id: utilisateur._id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        telephone: utilisateur.telephone,
        est_actif: utilisateur.est_actif,
        boutique_associee: utilisateur.boutique_associee
      }
    });
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Supprimer un utilisateur
exports.supprimerUtilisateur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.id);
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si c'est un gérant de boutique
    if (utilisateur.boutique_associee) {
      // Désactiver plutôt que supprimer
      utilisateur.est_actif = false;
      await utilisateur.save();
      
      return res.status(200).json({
        success: true,
        message: 'Utilisateur désactivé avec succès (était gérant de boutique)'
      });
    }

    await utilisateur.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Réinitialiser le mot de passe
exports.reinitialiserMotDePasse = async (req, res) => {
  try {
    const { nouveau_mot_de_passe } = req.body;

    if (!nouveau_mot_de_passe || nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const utilisateur = await Utilisateur.findById(req.params.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Hacher le nouveau mot de passe
    utilisateur.mot_de_passe_hash = await hasher(nouveau_mot_de_passe);
    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Activer/désactiver un utilisateur
exports.toggleActivationUtilisateur = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.params.id);
    
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    utilisateur.est_actif = !utilisateur.est_actif;
    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: `Utilisateur ${utilisateur.est_actif ? 'activé' : 'désactivé'} avec succès`,
      est_actif: utilisateur.est_actif
    });
  } catch (error) {
    console.error('Erreur activation utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut de l\'utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Statistiques utilisateurs (admin)
exports.statistiquesUtilisateurs = async (req, res) => {
  try {
    const [
      totalUtilisateurs,
      acheteurs,
      boutiques,
      admins,
      utilisateursActifs,
      nouveauxMois
    ] = await Promise.all([
      Utilisateur.countDocuments(),
      Utilisateur.countDocuments({ 'role.nom_role': 'acheteur' }),
      Utilisateur.countDocuments({ 'role.nom_role': 'boutique' }),
      Utilisateur.countDocuments({ 'role.nom_role': 'admin_centre' }),
      Utilisateur.countDocuments({ est_actif: true }),
      Utilisateur.countDocuments({
        date_creation: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
        }
      })
    ]);

    res.status(200).json({
      success: true,
      statistiques: {
        total_utilisateurs: totalUtilisateurs,
        acheteurs,
        boutiques,
        admins,
        utilisateurs_actifs: utilisateursActifs,
        nouveaux_mois: nouveauxMois,
        pourcentage_actifs: totalUtilisateurs > 0 ? (utilisateursActifs / totalUtilisateurs * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Erreur statistiques utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};