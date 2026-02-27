const Utilisateur = require('../models/utilisateur.model');
const Role = require('../models/role.model');
const Boutique = require('../models/boutique.model');
const { hasher, comparer } = require('../utils/password.util');
const { genererToken } = require('../utils/token.util');
const { validerEmail, validerMotDePasse } = require('../utils/validators');
const { deleteImageByUrl } = require('../utils/cloudinary.util');

exports.inscription = async (req, res) => {
  try {
    const { email, mot_de_passe, nom, prenom, telephone, role } = req.body;

    // Validation
    if (!email || !validerEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email invalide'
      });
    }

    if (!mot_de_passe || !validerMotDePasse(mot_de_passe)) {
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
      est_actif: role === 'acheteur' ? true : false // Les boutiques et admins doivent être activés par un admin
    });

    await nouvelUtilisateur.save();

    // Si c'est un gérant de boutique, créer la boutique vide
    if (role === 'boutique') {
      const categorieParDefaut = await require('../models/categorieBoutique.model').findOne();
      
      if (categorieParDefaut) {
        const nouvelleBoutique = new Boutique({
          nom: `Boutique de ${nom}`,
          description: 'Description à compléter',
          categorie: categorieParDefaut._id,
          gerant: nouvelUtilisateur._id,
          est_active: false
        });
        
        await nouvelleBoutique.save();
        
        // Associer la boutique à l'utilisateur
        nouvelUtilisateur.boutique_associee = nouvelleBoutique._id;
        await nouvelUtilisateur.save();
      }
    }

    // Générer le token
    const token = genererToken({
      id: nouvelUtilisateur._id,
      email: nouvelUtilisateur.email,
      role: roleTrouve.nom_role,
      nom: nouvelUtilisateur.nom,
      boutiqueId: nouvelUtilisateur.boutique_associee
    });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      utilisateur: {
        id: nouvelUtilisateur._id,
        email: nouvelUtilisateur.email,
        nom: nouvelUtilisateur.nom,
        prenom: nouvelUtilisateur.prenom,
        role: roleTrouve.nom_role,
        boutique_associee: nouvelUtilisateur.boutique_associee,
        est_actif: nouvelUtilisateur.est_actif
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.connexion = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur avec le rôle
    const utilisateur = await Utilisateur.findOne({ email })
      .populate('role')
      .populate('boutique_associee');
    
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
      prenom: utilisateur.prenom,
      boutiqueId: utilisateur.boutique_associee ? utilisateur.boutique_associee._id : null
    });

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      utilisateur: {
        id: utilisateur._id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role.nom_role,
        boutique_associee: utilisateur.boutique_associee,
        est_actif: utilisateur.est_actif,
        avatar_url: utilisateur.avatar_url
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.modifierProfil = async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse, preferences } = req.body;

    const utilisateur = await Utilisateur.findById(req.user.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour les informations
    if (nom && nom.length >= 2 && nom.length <= 50) utilisateur.nom = nom;
    if (prenom) utilisateur.prenom = prenom;
    if (telephone) utilisateur.telephone = telephone;
    if (adresse) {
      utilisateur.adresse = {
        ...utilisateur.adresse,
        ...adresse
      };
    }
    if (preferences) {
      utilisateur.preferences = {
        ...utilisateur.preferences,
        ...preferences
      };
    }

    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      utilisateur: {
        id: utilisateur._id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        telephone: utilisateur.telephone,
        adresse: utilisateur.adresse,
        preferences: utilisateur.preferences,
        role: req.user.role,
        boutique_associee: utilisateur.boutique_associee,
        avatar_url: utilisateur.avatar_url
      }
    });
  } catch (error) {
    console.error('Erreur modification profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du profil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.changerMotDePasse = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis'
      });
    }

    if (!validerMotDePasse(nouveau_mot_de_passe)) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

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
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Uploader l'avatar (création)
// ============================================
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    console.log('📸 Fichier uploadé Cloudinary:', {
      fieldname: req.file.fieldname,
      path: req.file.path,
      filename: req.file.filename
    });

    const utilisateur = await Utilisateur.findById(req.user.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // ✅ Utiliser l'URL Cloudinary complète
    const cloudinaryUrl = req.file.path;
    
    // Mettre à jour l'avatar
    utilisateur.avatar_url = cloudinaryUrl;
    await utilisateur.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploadé avec succès',
      avatar_url: cloudinaryUrl
    });
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de l\'avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Mettre à jour l'avatar (remplacement)
// ============================================
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    console.log('📸 Nouvel avatar uploadé:', req.file.path);

    const utilisateur = await Utilisateur.findById(req.user.id);
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // ✅ 1. Supprimer l'ancienne image de Cloudinary si elle existe
    if (utilisateur.avatar_url) {
      console.log('🗑️ Suppression de l\'ancien avatar:', utilisateur.avatar_url);
      await deleteImageByUrl(utilisateur.avatar_url);
    }

    // ✅ 2. Utiliser la nouvelle URL Cloudinary
    const cloudinaryUrl = req.file.path;
    utilisateur.avatar_url = cloudinaryUrl;
    await utilisateur.save();

    console.log('✅ Avatar mis à jour avec succès:', cloudinaryUrl);

    res.status(200).json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatar_url: cloudinaryUrl
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.deconnexion = async (req, res) => {
  try {
    // Dans une implémentation JWT simple, la déconnexion est gérée côté client
    // En supprimant le token. Ici, on peut simplement retourner un succès.
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};