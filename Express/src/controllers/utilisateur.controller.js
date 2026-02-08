const Utilisateur = require('../models/utilisateur.model');
const Role = require('../models/role.model');
const Boutique = require('../models/boutique.model');
const { hasher } = require('../utils/password.util');

// Admin seulement
exports.listerUtilisateurs = async (req, res) => {
  try {
    const { role, page = 1, limit = 10, est_actif } = req.query;
    
    const query = {};
    
    if (role) {
      const roleTrouve = await Role.findOne({ nom_role: role });
      if (roleTrouve) {
        query.role = roleTrouve._id;
      }
    }
    
    if (est_actif !== undefined) {
      query.est_actif = est_actif === 'true';
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: '-mot_de_passe_hash',
      populate: ['role', 'boutique_associee'],
      sort: { date_creation: -1 }
    };
    
    const utilisateurs = await Utilisateur.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...utilisateurs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: error.message
    });
  }
};

exports.creerUtilisateur = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, telephone, role, boutique_associee } = req.body;

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

    // Vérifier la boutique si spécifiée
    let boutiqueId = null;
    if (boutique_associee) {
      const boutique = await Boutique.findById(boutique_associee);
      if (!boutique) {
        return res.status(400).json({
          success: false,
          message: 'Boutique non trouvée'
        });
      }
      boutiqueId = boutique._id;
    }

    // Hacher le mot de passe
    const motDePasseHash = await hasher(mot_de_passe);

    // Créer l'utilisateur
    const nouvelUtilisateur = new Utilisateur({
      email,
      mot_de_passe_hash: motDePasseHash,
      nom,
      prenom,
      telephone,
      role: roleTrouve._id,
      boutique_associee: boutiqueId,
      est_actif: true
    });

    await nouvelUtilisateur.save();

    // Mettre à jour la boutique avec le gérant si nécessaire
    if (boutiqueId && role === 'boutique') {
      await Boutique.findByIdAndUpdate(boutiqueId, {
        gerant: nouvelUtilisateur._id
      });
    }

    // Ne pas envoyer le hash du mot de passe
    const utilisateurSansHash = nouvelUtilisateur.toObject();
    delete utilisateurSansHash.mot_de_passe_hash;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      utilisateur: utilisateurSansHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur',
      error: error.message
    });
  }
};

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
    if (nom) utilisateur.nom = nom;
    if (prenom) utilisateur.prenom = prenom;
    if (telephone) utilisateur.telephone = telephone;
    if (est_actif !== undefined) utilisateur.est_actif = est_actif;
    
    if (boutique_associee) {
      const boutique = await Boutique.findById(boutique_associee);
      if (!boutique) {
        return res.status(400).json({
          success: false,
          message: 'Boutique non trouvée'
        });
      }
      utilisateur.boutique_associee = boutique._id;
    }

    await utilisateur.save();

    // Ne pas envoyer le hash du mot de passe
    const utilisateurSansHash = utilisateur.toObject();
    delete utilisateurSansHash.mot_de_passe_hash;

    res.status(200).json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      utilisateur: utilisateurSansHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'utilisateur',
      error: error.message
    });
  }
};

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
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un gérant de boutique. Désactivez-le à la place.'
      });
    }

    await utilisateur.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur',
      error: error.message
    });
  }
};

exports.reinitialiserMotDePasse = async (req, res) => {
  try {
    const { nouveau_mot_de_passe } = req.body;

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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.message
    });
  }
};