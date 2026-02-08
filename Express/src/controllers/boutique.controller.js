const Boutique = require('../models/boutique.model');
const CategorieBoutique = require('../models/categorieBoutique.model');
const Utilisateur = require('../models/utilisateur.model');
const Produit = require('../models/produit.model');
const Commande = require('../models/commande.model');

// Admin: Créer une boutique
exports.creerBoutique = async (req, res) => {
  try {
    const { nom, description, categorie, gerant, contact, adresse, parametres } = req.body;

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
    const boutiqueExistante = await Boutique.findOne({ gerant: gerant });
    if (boutiqueExistante) {
      return res.status(400).json({
        success: false,
        message: 'Ce gérant a déjà une boutique'
      });
    }

    // Créer la boutique
    const nouvelleBoutique = new Boutique({
      nom,
      description,
      categorie: categorieTrouvee._id,
      gerant: gerantTrouve._id,
      contact: contact || {},
      adresse: adresse || {},
      parametres: parametres || {},
      est_active: true
    });

    await nouvelleBoutique.save();

    // Associer la boutique au gérant
    await Utilisateur.findByIdAndUpdate(gerant, {
      boutique_associee: nouvelleBoutique._id
    });

    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès',
      boutique: nouvelleBoutique
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la boutique',
      error: error.message
    });
  }
};

// Lister toutes les boutiques (avec filtres)
exports.listerBoutiques = async (req, res) => {
  try {
    const { categorie, est_active, page = 1, limit = 10, recherche } = req.query;
    
    const query = {};
    
    if (categorie) {
      query.categorie = categorie;
    }
    
    if (est_active !== undefined) {
      query.est_active = est_active === 'true';
    }
    
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } }
      ];
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'categorie', select: 'nom_categorie icone' },
        { path: 'gerant', select: 'nom prenom email' }
      ],
      sort: { 'statistiques.note_moyenne': -1, date_creation: -1 }
    };
    
    const boutiques = await Boutique.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...boutiques
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des boutiques',
      error: error.message
    });
  }
};

// Obtenir une boutique par ID
exports.obtenirBoutique = async (req, res) => {
  try {
    const boutique = await Boutique.findById(req.params.id)
      .populate('categorie')
      .populate('gerant', 'nom prenom email telephone')
      .populate({
        path: 'produits',
        match: { est_actif: true },
        options: { limit: 10 }
      });

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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la boutique',
      error: error.message
    });
  }
};

// Modifier une boutique (Admin)
exports.modifierBoutique = async (req, res) => {
  try {
    const { nom, description, categorie, contact, adresse, parametres, est_active } = req.body;

    const boutique = await Boutique.findById(req.params.id);
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée'
      });
    }

    // Mettre à jour les informations
    if (nom) boutique.nom = nom;
    if (description) boutique.description = description;
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
    if (contact) boutique.contact = { ...boutique.contact, ...contact };
    if (adresse) boutique.adresse = { ...boutique.adresse, ...adresse };
    if (parametres) boutique.parametres = { ...boutique.parametres, ...parametres };
    if (est_active !== undefined) boutique.est_active = est_active;

    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Boutique mise à jour avec succès',
      boutique
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la boutique',
      error: error.message
    });
  }
};

// Gérer le profil boutique (pour le gérant)
exports.gererProfilBoutique = async (req, res) => {
  try {
    const { nom, description, contact, logo_url, images, parametres } = req.body;

    // Vérifier que l'utilisateur est bien le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(404).json({
        success: false,
        message: 'Boutique non trouvée pour cet utilisateur'
      });
    }

    // Mettre à jour les informations
    if (nom) boutique.nom = nom;
    if (description) boutique.description = description;
    if (contact) boutique.contact = { ...boutique.contact, ...contact };
    if (logo_url) boutique.logo_url = logo_url;
    if (images) boutique.images = images;
    if (parametres) boutique.parametres = { ...boutique.parametres, ...parametres };

    await boutique.save();

    res.status(200).json({
      success: true,
      message: 'Profil boutique mis à jour avec succès',
      boutique
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil boutique',
      error: error.message
    });
  }
};

// Obtenir les produits d'une boutique
exports.obtenirProduitsBoutique = async (req, res) => {
  try {
    const { page = 1, limit = 20, categorie, en_promotion, tri } = req.query;
    
    const query = { boutique: req.params.id, est_actif: true };
    
    if (categorie) {
      query.categorie_produit = categorie;
    }
    
    if (en_promotion === 'true') {
      query.en_promotion = true;
    }
    
    let sort = {};
    switch (tri) {
      case 'prix_asc':
        sort.prix = 1;
        break;
      case 'prix_desc':
        sort.prix = -1;
        break;
      case 'nouveautes':
        sort.date_creation = -1;
        break;
      case 'ventes':
        sort['statistiques.nombre_ventes'] = -1;
        break;
      default:
        sort.date_creation = -1;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: 'categorie_produit',
      sort
    };
    
    const produits = await Produit.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...produits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: error.message
    });
  }
};

// Activer/désactiver une boutique (Admin)
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
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut de la boutique',
      error: error.message
    });
  }
};