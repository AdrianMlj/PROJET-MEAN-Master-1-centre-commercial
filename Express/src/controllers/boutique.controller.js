const mongoose = require('mongoose');
const Boutique = require('../models/boutique.model');
const CategorieBoutique = require('../models/categorieBoutique.model');
const Utilisateur = require('../models/utilisateur.model');
const Produit = require('../models/produit.model');
const Commande = require('../models/commande.model');

// Lister toutes les boutiques (publique)
exports.listerBoutiques = async (req, res) => {
  try {
    const { categorie, est_active, page = 1, limit = 10, recherche, tri } = req.query;
    
    const query = {};
    
    // Par défaut, ne montrer que les boutiques actives pour les utilisateurs non-admin
    if (req.user?.role !== 'admin_centre') {
      query.est_active = true;
    }
    
    // Filtres supplémentaires
    if (categorie) {
      query.categorie = categorie;
    }
    
    if (est_active !== undefined && req.user?.role === 'admin_centre') {
      query.est_active = est_active === 'true';
    }
    
    // Recherche
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { slogan: { $regex: recherche, $options: 'i' } }
      ];
    }
    
    let sort = { 'statistiques.note_moyenne': -1 };
    if (tri) {
      switch (tri) {
        case 'nouveautes':
          sort = { date_creation: -1 };
          break;
        case 'nom_asc':
          sort = { nom: 1 };
          break;
        case 'nom_desc':
          sort = { nom: -1 };
          break;
        case 'ventes':
          sort = { 'statistiques.commandes_traitees': -1 };
          break;
        case 'chiffre_affaires':
          sort = { 'statistiques.chiffre_affaires': -1 };
          break;
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'categorie', select: 'nom_categorie icone' },
        { path: 'gerant', select: 'nom prenom email' }
      ],
      sort,
      select: '-informations_bancaires'
    };
    
    const boutiques = await Boutique.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...boutiques
    });
  } catch (error) {
    console.error('Erreur liste boutiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des boutiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN: Lister toutes les boutiques (même inactives)
// ============================================
exports.listerToutesBoutiques = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categorie, 
      est_active,
      recherche,
      tri = 'date_creation',
      statut_paiement 
    } = req.query;
    
    // Construction de la requête
    const query = {};
    
    // Filtres optionnels
    if (categorie) {
      query.categorie = categorie;
    }
    
    if (est_active !== undefined) {
      query.est_active = est_active === 'true';
    }
    
    if (statut_paiement) {
      query.statut_paiement = statut_paiement; // 'paye' ou 'impaye'
    }
    
    // Recherche par nom, description ou slogan
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { slogan: { $regex: recherche, $options: 'i' } },
        { 'contact.email': { $regex: recherche, $options: 'i' } }
      ];
    }
    
    // Tri
    let sort = {};
    switch (tri) {
      case 'date_creation':
        sort = { date_creation: -1 };
        break;
      case 'nom_asc':
        sort = { nom: 1 };
        break;
      case 'nom_desc':
        sort = { nom: -1 };
        break;
      case 'ventes':
        sort = { 'statistiques.commandes_traitees': -1 };
        break;
      case 'chiffre_affaires':
        sort = { 'statistiques.chiffre_affaires': -1 };
        break;
      case 'note':
        sort = { 'statistiques.note_moyenne': -1 };
        break;
      case 'paiement':
        sort = { statut_paiement: 1 }; // Les impayés d'abord
        break;
      default:
        sort = { date_creation: -1 };
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'categorie', select: 'nom_categorie icone' },
        { path: 'gerant', select: 'nom prenom email telephone' }
      ],
      sort,
      select: '-informations_bancaires' // On cache toujours les infos bancaires
    };
    
    const boutiques = await Boutique.paginate(query, options);
    
    // Statistiques supplémentaires pour l'admin
    const stats = {
      total: boutiques.totalDocs,
      actives: boutiques.docs.filter(b => b.est_active).length,
      inactives: boutiques.docs.filter(b => !b.est_active).length,
      payees: boutiques.docs.filter(b => b.statut_paiement === 'paye').length,
      impayees: boutiques.docs.filter(b => b.statut_paiement === 'impaye').length
    };
    
    res.status(200).json({
      success: true,
      stats, // Statistiques en plus
      ...boutiques
    });
    
  } catch (error) {
    console.error('Erreur liste toutes boutiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de toutes les boutiques',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir une boutique par ID (publique)
exports.obtenirBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('categorie')
      .populate('gerant', 'nom prenom email telephone avatar_url')
      .select('-informations_bancaires');

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Si l'utilisateur n'est pas admin et la boutique n'est pas active
    if (!boutique.est_active && req.user?.role !== 'admin_centre') {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      boutique
    });
  } catch (error) {
    console.error('Erreur obtention boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN: Récupérer une boutique par ID (même inactive)
// ============================================
exports.obtenirBoutiqueAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    const boutique = await Boutique.findById(id)
      .populate('categorie')
      .populate('gerant', 'nom prenom email telephone avatar_url')
      .select('-informations_bancaires'); // On cache toujours les infos bancaires

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // ✅ Pas de vérification de est_active - l'admin voit tout !

    res.status(200).json({
      success: true,
      boutique
    });

  } catch (error) {
    console.error('Erreur récupération boutique admin:', error);
    
    // Gérer les erreurs d'ID invalide
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de boutique invalide'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Créer une boutique
exports.creerBoutique = async (req, res) => {
  try {
    const { nom, description, categorie, gerant, contact, adresse, parametres, slogan } = req.body;

    // Validation
    if (!nom || nom.length < 2 || nom.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la boutique doit contenir entre 2 et 100 caractères'
      });
    }

    // Vérifier la catégorie
    const categorieTrouvee = await CategorieBoutique.findById(categorie);
    if (!categorieTrouvee) {
      return res.status(400).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier le gérant
    const gerantTrouve = await Utilisateur.findById(gerant);
    if (!gerantTrouve) {
      return res.status(400).json({
        success: false,
        message: 'Gérant non trouvé'
      });
    }

    // Vérifier que le gérant n'a pas déjà une boutique
    const boutiqueExistante = await Boutique.findOne({ gerant: gerantTrouve._id });
    if (boutiqueExistante) {
      return res.status(400).json({
        success: false,
        message: 'Ce gérant a déjà une boutique'
      });
    }

    // Vérifier que le gérant a le rôle "boutique"
    const roleBoutique = await require('../models/role.model').findOne({ nom_role: 'boutique' });
    if (!gerantTrouve.role.equals(roleBoutique._id)) {
      return res.status(400).json({
        success: false,
        message: 'Le gérant doit avoir le rôle "boutique"'
      });
    }

    // Créer la boutique
    const nouvelleBoutique = new Boutique({
      nom,
      description: description || '',
      slogan: slogan || '',
      categorie: categorieTrouvee._id,
      gerant: gerantTrouve._id,
      contact: contact || {},
      adresse: adresse || {},
      parametres: parametres || {},
      est_active: true
    });

    await nouvelleBoutique.save();

    // Associer la boutique au gérant
    gerantTrouve.boutique_associee = nouvelleBoutique._id;
    await gerantTrouve.save();

    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès',
      boutique: nouvelleBoutique
    });
  } catch (error) {
    console.error('Erreur création boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Modifier une boutique
exports.modifierBoutique = async (req, res) => {
  try {
    const { nom, description, categorie, contact, adresse, parametres, est_active, slogan } = req.body;

    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Mettre à jour les informations
    if (nom && nom.length >= 2 && nom.length <= 100) boutique.nom = nom;
    if (description !== undefined) boutique.description = description;
    if (slogan !== undefined) boutique.slogan = slogan;
    
    if (categorie) {
      const categorieTrouvee = await CategorieBoutique.findById(categorie);
      if (!categorieTrouvee) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
      boutique.categorie = categorieTrouvee._id;
    }
    
    if (contact) {
      boutique.contact = { ...boutique.contact, ...contact };
    }
    
    if (adresse) {
      boutique.adresse = { ...boutique.adresse, ...adresse };
    }
    
    if (parametres) {
      boutique.parametres = { ...boutique.parametres, ...parametres };
    }
    
    if (est_active !== undefined) {
      boutique.est_active = est_active;
    }

    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Boutique mise à jour avec succès',
      boutique
    });
  } catch (error) {
    console.error('Erreur modification boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Gérer son profil boutique
exports.gererProfilBoutique = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est bien le gérant d'une boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée pour cet utilisateur'
      });
    }

    const { nom, description, slogan, contact, parametres, social } = req.body;

    // Mettre à jour les informations
    if (nom && nom.length >= 2 && nom.length <= 100) boutique.nom = nom;
    if (description !== undefined) boutique.description = description;
    if (slogan !== undefined) boutique.slogan = slogan;
    
    if (contact) {
      boutique.contact = { ...boutique.contact, ...contact };
    }
    
    if (parametres) {
      boutique.parametres = { ...boutique.parametres, ...parametres };
    }
    
    if (social) {
      boutique.social = { ...boutique.social, ...social };
    }

    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Profil boutique mis à jour avec succès',
      boutique
    });
  } catch (error) {
    console.error('Erreur profil boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les produits d'une boutique (publique)
exports.obtenirProduitsBoutique = async (req, res) => {
  try {
    const { page = 1, limit = 20, categorie, en_promotion, tri, min_prix, max_prix } = req.query;
    
    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }
    
    // Vérifier si la boutique est active (sauf pour admin)
    if (!boutique.est_active && req.user?.role !== 'admin_centre') {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }
    
    const query = { boutique: boutique._id, est_actif: true };
    
    // Filtres
    if (categorie && categorie !== 'tous') {
      query.categorie_produit = categorie;
    }
    
    if (en_promotion === 'true') {
      query.en_promotion = true;
      query.date_fin_promotion = { $gte: new Date() };
      query.date_debut_promotion = { $lte: new Date() };
    }
    
    if (min_prix || max_prix) {
      query.$or = [
        { 
          en_promotion: true,
          prix_promotion: { 
            $gte: min_prix ? parseFloat(min_prix) : 0,
            $lte: max_prix ? parseFloat(max_prix) : Number.MAX_SAFE_INTEGER
          }
        },
        {
          en_promotion: false,
          prix: { 
            $gte: min_prix ? parseFloat(min_prix) : 0,
            $lte: max_prix ? parseFloat(max_prix) : Number.MAX_SAFE_INTEGER
          }
        }
      ];
    }
    
    let sort = { date_creation: -1 };
    if (tri) {
      switch (tri) {
        case 'prix_asc':
          sort = { prix: 1 };
          break;
        case 'prix_desc':
          sort = { prix: -1 };
          break;
        case 'nouveautes':
          sort = { date_creation: -1 };
          break;
        case 'ventes':
          sort = { 'statistiques.nombre_ventes': -1 };
          break;
        case 'note':
          sort = { 'statistiques.note_moyenne': -1 };
          break;
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: 'categorie_produit',
      sort
    };
    
    const produits = await Produit.paginate(query, options);
    
    // Récupérer les catégories de produits de cette boutique
    const categories = await require('../models/categorieProduit.model').find({
      boutique: boutique._id,
      est_active: true
    }).select('nom_categorie');
    
    res.status(200).json({
      success: true,
      boutique: {
        id: boutique._id,
        nom: boutique.nom,
        logo_url: boutique.logo_url
      },
      categories,
      ...produits
    });
  } catch (error) {
    console.error('Erreur produits boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Activer/désactiver une boutique
exports.toggleActivationBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id);
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    boutique.est_active = !boutique.est_active;
    await boutique.save();

    res.status(200).json({
      success: true,
      message: `Boutique ${boutique.est_active ? 'activée' : 'désactivée'} avec succès`,
      boutique
    });
  } catch (error) {
    console.error('Erreur activation boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Obtenir ma boutique
exports.obtenirMaBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ gerant: req.user.id })
      .populate('categorie')
      .populate('gerant', 'nom prenom email telephone avatar_url');

    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      boutique
    });
  } catch (error) {
    console.error('Erreur ma boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de votre boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// UPLOADER LE LOGO (POST)
// ============================================
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    const logoUrl = `/uploads/boutiques/${req.file.filename}`;
    boutique.logo_url = logoUrl;
    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Logo uploadé avec succès',
      logo_url: logoUrl
    });
  } catch (error) {
    console.error('Erreur upload logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du logo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// METTRE À JOUR LE LOGO (PUT)
// ============================================
exports.updateLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    const logoUrl = `/uploads/boutiques/${req.file.filename}`;
    boutique.logo_url = logoUrl;
    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Logo mis à jour avec succès',
      logo_url: logoUrl
    });
  } catch (error) {
    console.error('Erreur mise à jour logo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du logo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// UPLOADER PLUSIEURS IMAGES (POST)
// ============================================
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée pour cet utilisateur'
      });
    }

    // Limiter le nombre total d'images (max 10)
    const MAX_IMAGES = 10;
    if (boutique.images.length + req.files.length > MAX_IMAGES) {
      return res.status(400).json({
        success: false,
        message: `Vous ne pouvez pas avoir plus de ${MAX_IMAGES} images au total. Actuellement: ${boutique.images.length}`
      });
    }

    const nouvellesImages = req.files.map(file => 
      `/uploads/boutiques/${file.filename}`
    );

    boutique.images = [...boutique.images, ...nouvellesImages];
    await boutique.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploadée(s) avec succès`,
      images: boutique.images,
      total_images: boutique.images.length
    });
  } catch (error) {
    console.error('Erreur upload multiple images:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// SUPPRIMER UNE IMAGE (DELETE)
// ============================================
exports.supprimerImage = async (req, res) => {
  try {
    const { index } = req.params;
    const imageIndex = parseInt(index);
    
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Vérifier si l'index est valide
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= boutique.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Index d\'image invalide'
      });
    }

    // Supprimer l'image du tableau
    const imageSupprimee = boutique.images.splice(imageIndex, 1);
    
    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Image supprimée avec succès',
      image_supprimee: imageSupprimee[0],
      images: boutique.images
    });

  } catch (error) {
    console.error('Erreur suppression image:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// RÉCUPÉRER TOUTES LES IMAGES (GET)
// ============================================
exports.getImages = async (req, res) => {
  try {
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      logo_url: boutique.logo_url,
      images: boutique.images,
      total_images: boutique.images.length + (boutique.logo_url ? 1 : 0)
    });

  } catch (error) {
    console.error('Erreur récupération images:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// DÉFINIR UNE IMAGE COMME PRINCIPALE (PATCH)
// ============================================
exports.setImagePrincipale = async (req, res) => {
  try {
    const { index } = req.params;
    const imageIndex = parseInt(index);
    
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Vérifier si l'index est valide
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= boutique.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Index d\'image invalide'
      });
    }

    // Récupérer l'image à définir comme principale
    const imagePrincipale = boutique.images[imageIndex];
    
    // Supprimer l'image du tableau
    boutique.images.splice(imageIndex, 1);
    
    // Définir comme nouveau logo
    boutique.logo_url = imagePrincipale;
    
    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Image principale mise à jour avec succès',
      logo_url: boutique.logo_url,
      images: boutique.images
    });

  } catch (error) {
    console.error('Erreur définition image principale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la définition de l\'image principale',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ✅ API POUR PAYER LA LOCATION (NOUVEAU)
// ============================================
exports.payerLocation = async (req, res) => {
  try {
    // 1. Récupérer la boutique du gérant connecté
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // 2. Vérifier si la boutique a déjà payé
    if (boutique.statut_paiement === 'paye') {
      return res.status(400).json({
        success: false,
        message: 'La boutique a déjà payé sa location'
      });
    }

    // 3. SIMULATION DE PAIEMENT (ici vous intégrerez Stripe plus tard)
    // Pour l'instant, on suppose que le paiement réussit toujours
    
    // 4. ✅ METTRE À JOUR LE STATUT DE PAIEMENT
    boutique.statut_paiement = 'paye';
    
    // 5. Sauvegarder
    await boutique.save();

    // 6. Réponse
    res.status(200).json({
      success: true,
      message: '✅ Paiement de la location effectué avec succès',
      boutique: {
        id: boutique._id,
        nom: boutique.nom,
        statut_paiement: boutique.statut_paiement,
        est_active: boutique.est_active
      }
    });

  } catch (error) {
    console.error('Erreur paiement location:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement de la location',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ADMIN: Supprimer une boutique (VERSION SANS TRANSACTION)
// ============================================
exports.supprimerBoutique = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Récupérer la boutique
    const boutique = await Boutique.findById(id).populate('gerant');
    
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // 2. Récupérer le nom pour le message
    const nomBoutique = boutique.nom;

    // 3. SUPPRIMER LES PRODUITS
    const Produit = require('../models/produit.model');
    await Produit.deleteMany({ boutique: boutique._id });

    // 4. SUPPRIMER LES CATÉGORIES DE PRODUITS
    const CategorieProduit = require('../models/categorieProduit.model');
    await CategorieProduit.deleteMany({ boutique: boutique._id });

    // 5. DISSOCIER LE GÉRANT
    if (boutique.gerant) {
      const Utilisateur = require('../models/utilisateur.model');
      await Utilisateur.findByIdAndUpdate(
        boutique.gerant._id,
        { boutique_associee: null }
      );
    }

    // 6. SUPPRIMER LA BOUTIQUE
    await boutique.deleteOne();

    res.status(200).json({
      success: true,
      message: `✅ Boutique "${nomBoutique}" supprimée avec succès`,
      details: {
        boutique_supprimee: nomBoutique,
        produits_supprimes: true,
        gerant_dissocie: true
      }
    });

  } catch (error) {
    console.error('Erreur suppression boutique:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID de boutique invalide'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};