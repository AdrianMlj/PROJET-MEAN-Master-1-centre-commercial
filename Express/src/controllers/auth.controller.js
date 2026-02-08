const Utilisateur = require('../models/utilisateur.model');
const Role = require('../models/role.model');
const { hasher, comparer } = require('../utils/password.util');
const { genererToken } = require('../utils/token.util');

exports.inscription = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, telephone, role } = req.body;

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
      prenom,
      telephone,
      role: roleTrouve._id
    });

    await nouvelUtilisateur.save();

    // Générer le token
    const token = genererToken({
      id: nouvelUtilisateur._id,
      email: nouvelUtilisateur.email,
      role: roleTrouve.nom_role,
      nom: nouvelUtilisateur.nom
    });

    // Ne pas envoyer le hash du mot de passe
    const utilisateurSansHash = nouvelUtilisateur.toObject();
    delete utilisateurSansHash.mot_de_passe_hash;

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      utilisateur: utilisateurSansHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

exports.connexion = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Trouver l'utilisateur
    const utilisateur = await Utilisateur.findOne({ email }).populate('role');
    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!utilisateur.est_actif) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await comparer(mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour la dernière connexion
    utilisateur.date_derniere_connexion = new Date();
    await utilisateur.save();

    // Générer le token
    const token = genererToken({
      id: utilisateur._id,
      email: utilisateur.email,
      role: utilisateur.role.nom_role,
      nom: utilisateur.nom,
      boutiqueId: utilisateur.boutique_associee
    });

    // Ne pas envoyer le hash du mot de passe
    const utilisateurSansHash = utilisateur.toObject();
    delete utilisateurSansHash.mot_de_passe_hash;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      utilisateur: utilisateurSansHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

exports.profil = async (req, res) => {
  try {
    const utilisateur = await Utilisateur.findById(req.user.id)
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
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

exports.modifierProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse } = req.body;

    const utilisateur = await Utilisateur.findById(req.user.id);
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
    if (adresse) utilisateur.adresse = adresse;

    await utilisateur.save();

    // Ne pas envoyer le hash du mot de passe
    const utilisateurSansHash = utilisateur.toObject();
    delete utilisateurSansHash.mot_de_passe_hash;

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      utilisateur: utilisateurSansHash
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du profil',
      error: error.message
    });
  }
};

exports.changerMotDePasse = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    const utilisateur = await Utilisateur.findById(req.user.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier l'ancien mot de passe
    const motDePasseValide = await comparer(ancien_mot_de_passe, utilisateur.mot_de_passe_hash);
    if (!motDePasseValide) {
      return res.status(400).json({
        success: false,
        message: 'Ancien mot de passe incorrect'
      });
    }

    // Hacher le nouveau mot de passe
    utilisateur.mot_de_passe_hash = await hasher(nouveau_mot_de_passe);
    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};