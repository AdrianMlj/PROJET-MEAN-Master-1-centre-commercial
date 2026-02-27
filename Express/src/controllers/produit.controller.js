const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');
const CategorieProduit = require('../models/categorieProduit.model');
const { deleteImageByUrl } = require('../utils/cloudinary.util');

// Lister les produits avec filtres (publique)
exports.listerProduits = async (req, res) => {
  try {
    const { 
      boutique, 
      categorie, 
      min_prix, 
      max_prix, 
      en_promotion, 
      recherche,
      tags,
      page = 1, 
      limit = 20,
      tri = 'nouveautes'
    } = req.query;
    
    const query = { est_actif: true };
    
    // Filtrer par boutique active
    if (boutique) {
      const boutiqueDoc = await Boutique.findOne({ 
        _id: boutique, 
        est_active: true 
      });
      if (boutiqueDoc) {
        query.boutique = boutiqueDoc._id;
      } else {
        return res.status(200).json({
          success: true,
          docs: [],
          totalDocs: 0,
          limit: parseInt(limit),
          page: parseInt(page),
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
          pagingCounter: 1
        });
      }
    } else {
      // Si pas de boutique spécifique, vérifier que la boutique est active
      const boutiquesActives = await Boutique.find({ est_active: true }).select('_id');
      query.boutique = { $in: boutiquesActives.map(b => b._id) };
    }
    
    // Filtre par catégorie produit
    if (categorie && categorie !== 'tous') {
      query.categorie_produit = categorie;
    }
    
    // Filtre par prix
    if (min_prix || max_prix) {
      const min = min_prix ? parseFloat(min_prix) : 0;
      const max = max_prix ? parseFloat(max_prix) : Number.MAX_SAFE_INTEGER;
      
      query.$or = [
        { 
          en_promotion: true,
          prix_promotion: { $gte: min, $lte: max }
        },
        {
          en_promotion: false,
          prix: { $gte: min, $lte: max }
        }
      ];
    }
    
    // Filtre par promotion
    if (en_promotion === 'true') {
      query.en_promotion = true;
      query.date_fin_promotion = { $gte: new Date() };
      query.date_debut_promotion = { $lte: new Date() };
    }
    
    // Recherche
    if (recherche) {
      query.$or = [
        { nom: { $regex: recherche, $options: 'i' } },
        { description: { $regex: recherche, $options: 'i' } },
        { tags: { $regex: recherche, $options: 'i' } }
      ];
    }
    
    // Filtre par tags
    if (tags) {
      const tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagsArray };
    }
    
    // Tri
    let sort = {};
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
      case 'promotion':
        sort = { 'prix_promotion': 1 };
        break;
      default:
        sort = { date_creation: -1 };
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { 
          path: 'boutique', 
          select: 'nom logo_url est_active',
          match: { est_active: true }
        },
        { 
          path: 'categorie_produit', 
          select: 'nom_categorie'
        }
      ],
      sort
    };
    
    const produits = await Produit.paginate(query, options);
    
    // Pour les produits en promotion, calculer le pourcentage de réduction
    const produitsAvecPromo = produits.docs.map(produit => {
      const produitObj = produit.toObject();
      if (produitObj.en_promotion && produitObj.prix_promotion < produitObj.prix) {
        const reduction = produitObj.prix - produitObj.prix_promotion;
        produitObj.pourcentage_reduction = Math.round((reduction / produitObj.prix) * 100);
      } else {
        produitObj.pourcentage_reduction = 0;
      }
      return produitObj;
    });
    
    res.status(200).json({
      success: true,
      ...produits,
      docs: produitsAvecPromo
    });
  } catch (error) {
    console.error('Erreur liste produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir un produit par ID (publique)
exports.obtenirProduit = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id)
      .populate({
        path: 'boutique',
        select: 'nom logo_url description contact adresse statistiques est_active',
        match: { est_active: true }
      })
      .populate('categorie_produit');

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que le produit est actif (sauf pour admin et gérant de la boutique)
    if (!produit.est_actif) {
      if (req.user?.role === 'admin_centre') {
        // Admin peut voir tous les produits
      } else if (req.user?.role === 'boutique') {
        // Vérifier si l'utilisateur est le gérant de cette boutique
        const boutique = await Boutique.findOne({ gerant: req.user.id });
        if (!boutique || !produit.boutique._id.equals(boutique._id)) {
          return res.status(404).json({
            success: false,
            message: 'Produit non trouvé'
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'Produit non trouvé'
        });
      }
    }

    // Vérifier que la boutique est active (pour les acheteurs)
    if (req.user?.role === 'acheteur' && (!produit.boutique || !produit.boutique.est_active)) {
      return res.status(404).json({
        success: false,
        message: 'Produit non disponible'
      });
    }

    // Incrémenter le compteur de vues
    produit.statistiques.nombre_vues += 1;
    await produit.save();

    // Ajouter le pourcentage de réduction si en promotion
    const produitObj = produit.toObject();
    if (produitObj.en_promotion && produitObj.prix_promotion < produitObj.prix) {
      const reduction = produitObj.prix - produitObj.prix_promotion;
      produitObj.pourcentage_reduction = Math.round((reduction / produitObj.prix) * 100);
    } else {
      produitObj.pourcentage_reduction = 0;
    }

    res.status(200).json({
      success: true,
      produit: produitObj
    });
  } catch (error) {
    console.error('Erreur obtention produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Créer un produit
exports.creerProduit = async (req, res) => {
  try {
    const { 
      nom, 
      description, 
      prix, 
      quantite_stock, 
      categorie_produit, 
      caracteristiques, 
      tags,
      description_detaillee,
      seuil_alerte,
      poids,
      dimensions
    } = req.body;

    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour créer un produit'
      });
    }

    // Validation
    if (!nom || nom.length < 2 || nom.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du produit doit contenir entre 2 et 200 caractères'
      });
    }

    if (!prix || isNaN(prix) || prix < 0) {
      return res.status(400).json({
        success: false,
        message: 'Prix invalide'
      });
    }

    if (quantite_stock !== undefined && (isNaN(quantite_stock) || quantite_stock < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Quantité en stock invalide'
      });
    }

    // Vérifier la catégorie produit si spécifiée
    let categorieId = null;
    if (categorie_produit) {
      const categorie = await CategorieProduit.findOne({
        _id: categorie_produit,
        boutique: boutique._id
      });
      if (!categorie) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie produit non trouvée pour votre boutique'
        });
      }
      categorieId = categorie._id;
    }

    // Traiter les tags
    let tagsArray = [];
    if (tags) {
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      } else if (Array.isArray(tags)) {
        tagsArray = tags.map(tag => tag.toString().trim().toLowerCase());
      }
    }

    // Traiter les caractéristiques
    let caracteristiquesArray = [];
    if (caracteristiques) {
      try {
        if (typeof caracteristiques === 'string') {
          caracteristiquesArray = JSON.parse(caracteristiques);
        } else if (Array.isArray(caracteristiques)) {
          caracteristiquesArray = caracteristiques;
        }
      } catch (error) {
        caracteristiquesArray = [];
      }
    }

    // Créer le produit
    const nouveauProduit = new Produit({
      nom,
      description: description || '',
      description_detaillee: description_detaillee || '',
      prix: parseFloat(prix),
      quantite_stock: quantite_stock ? parseInt(quantite_stock) : 0,
      seuil_alerte: seuil_alerte ? parseInt(seuil_alerte) : 5,
      categorie_produit: categorieId,
      boutique: boutique._id,
      caracteristiques: caracteristiquesArray,
      tags: tagsArray,
      est_actif: true,
      poids: poids ? parseFloat(poids) : undefined,
      dimensions: dimensions || undefined
    });

    await nouveauProduit.save();

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      produit: nouveauProduit
    });
  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Modifier un produit
exports.modifierProduit = async (req, res) => {
  try {
    const { 
      nom, 
      description, 
      prix, 
      quantite_stock, 
      categorie_produit, 
      est_actif, 
      en_promotion, 
      prix_promotion,
      date_fin_promotion,
      caracteristiques,
      tags,
      description_detaillee,
      seuil_alerte,
      poids,
      dimensions
    } = req.body;

    // Récupérer le produit
    const produit = await Produit.findById(req.params.id);
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }

    // Mettre à jour les informations
    if (nom && nom.length >= 2 && nom.length <= 200) produit.nom = nom;
    if (description !== undefined) produit.description = description;
    if (description_detaillee !== undefined) produit.description_detaillee = description_detaillee;
    
    if (prix !== undefined) {
      const prixNum = parseFloat(prix);
      if (!isNaN(prixNum) && prixNum >= 0) {
        produit.prix = prixNum;
      }
    }
    
    if (quantite_stock !== undefined) {
      const quantiteNum = parseInt(quantite_stock);
      if (!isNaN(quantiteNum) && quantiteNum >= 0) {
        produit.quantite_stock = quantiteNum;
      }
    }
    
    if (seuil_alerte !== undefined) {
      const seuilNum = parseInt(seuil_alerte);
      if (!isNaN(seuilNum) && seuilNum >= 0) {
        produit.seuil_alerte = seuilNum;
      }
    }
    
    if (categorie_produit !== undefined) {
      if (categorie_produit === null || categorie_produit === '') {
        produit.categorie_produit = null;
      } else {
        const categorie = await CategorieProduit.findOne({
          _id: categorie_produit,
          boutique: boutique._id
        });
        if (!categorie) {
          return res.status(400).json({
            success: false,
            message: 'Catégorie produit non trouvée pour votre boutique'
          });
        }
        produit.categorie_produit = categorie._id;
      }
    }
    
    if (est_actif !== undefined) produit.est_actif = est_actif;
    
    // Gestion de la promotion
    if (en_promotion !== undefined) {
      produit.en_promotion = en_promotion;
      
      if (en_promotion) {
        if (prix_promotion !== undefined) {
          const promoPrix = parseFloat(prix_promotion);
          if (!isNaN(promoPrix) && promoPrix >= 0 && promoPrix < produit.prix) {
            produit.prix_promotion = promoPrix;
            produit.date_debut_promotion = new Date();
            
            if (date_fin_promotion) {
              produit.date_fin_promotion = new Date(date_fin_promotion);
            } else {
              // Définir une date de fin par défaut (30 jours)
              const dateFin = new Date();
              dateFin.setDate(dateFin.getDate() + 30);
              produit.date_fin_promotion = dateFin;
            }
          } else {
            return res.status(400).json({
              success: false,
              message: 'Le prix promotionnel doit être inférieur au prix normal et positif'
            });
          }
        }
      } else {
        produit.prix_promotion = null;
        produit.date_debut_promotion = null;
        produit.date_fin_promotion = null;
      }
    } else if (prix_promotion !== undefined) {
      // Si seulement le prix promotionnel est modifié
      const promoPrix = parseFloat(prix_promotion);
      if (!isNaN(promoPrix) && promoPrix >= 0 && promoPrix < produit.prix) {
        produit.prix_promotion = promoPrix;
        produit.en_promotion = true;
        produit.date_debut_promotion = new Date();
        
        if (!produit.date_fin_promotion) {
          const dateFin = new Date();
          dateFin.setDate(dateFin.getDate() + 30);
          produit.date_fin_promotion = dateFin;
        }
      }
    }
    
    // Mettre à jour les caractéristiques
    if (caracteristiques !== undefined) {
      try {
        if (typeof caracteristiques === 'string') {
          produit.caracteristiques = JSON.parse(caracteristiques);
        } else if (Array.isArray(caracteristiques)) {
          produit.caracteristiques = caracteristiques;
        }
      } catch (error) {
        // Garder les caractéristiques existantes en cas d'erreur
      }
    }
    
    // Mettre à jour les tags
    if (tags !== undefined) {
      let tagsArray = [];
      if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      } else if (Array.isArray(tags)) {
        tagsArray = tags.map(tag => tag.toString().trim().toLowerCase());
      }
      produit.tags = tagsArray;
    }
    
    // Mettre à jour le poids et dimensions
    if (poids !== undefined) {
      const poidsNum = parseFloat(poids);
      if (!isNaN(poidsNum) && poidsNum >= 0) {
        produit.poids = poidsNum;
      }
    }
    
    if (dimensions !== undefined) {
      produit.dimensions = dimensions;
    }

    await produit.save();

    res.status(200).json({
      success: true,
      message: 'Produit mis à jour avec succès',
      produit
    });
  } catch (error) {
    console.error('Erreur modification produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Supprimer un produit (définitivement)
exports.supprimerProduit = async (req, res) => {
  try {
    // Récupérer le produit
    const produit = await Produit.findById(req.params.id);
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce produit'
      });
    }

    // ✅ Suppression définitive
    await produit.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Produit supprimé définitivement avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Gérer le stock d'un produit
exports.gererStock = async (req, res) => {
  try {
    const { operation, quantite } = req.body;

    if (!operation || !['ajouter', 'retirer', 'definir'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: 'Opération invalide. Options: ajouter, retirer, definir'
      });
    }

    if (!quantite || isNaN(quantite) || quantite <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide'
      });
    }

    const quantiteNum = parseInt(quantite);

    const produit = await Produit.findById(req.params.id);
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à gérer le stock de ce produit'
      });
    }

    // Appliquer l'opération
    let nouveauStock = produit.quantite_stock;
    
    switch (operation) {
      case 'ajouter':
        nouveauStock += quantiteNum;
        break;
      case 'retirer':
        if (produit.quantite_stock < quantiteNum) {
          return res.status(400).json({
            success: false,
            message: 'Stock insuffisant'
          });
        }
        nouveauStock -= quantiteNum;
        break;
      case 'definir':
        nouveauStock = quantiteNum;
        break;
    }

    produit.quantite_stock = nouveauStock;
    await produit.save();

    res.status(200).json({
      success: true,
      message: 'Stock mis à jour avec succès',
      nouveau_stock: produit.quantite_stock
    });
  } catch (error) {
    console.error('Erreur gestion stock:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion du stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Obtenir les produits de sa boutique
exports.obtenirProduitsBoutiqueGérant = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique'
      });
    }
    
    const { 
      est_actif, 
      categorie, 
      en_promotion, 
      faible_stock,
      page = 1, 
      limit = 20,
      tri = 'nouveautes'
    } = req.query;
    
    const query = { boutique: boutique._id };
    
    // Filtres
    if (est_actif !== undefined) {
      query.est_actif = est_actif === 'true';
    }
    
    if (categorie && categorie !== 'tous') {
      query.categorie_produit = categorie;
    }
    
    if (en_promotion === 'true') {
      query.en_promotion = true;
    }
    
    if (faible_stock === 'true') {
      query.$expr = { $lte: ['$quantite_stock', '$seuil_alerte'] };
    }
    
    // Tri
    let sort = {};
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
      case 'stock_asc':
        sort = { quantite_stock: 1 };
        break;
      case 'stock_desc':
        sort = { quantite_stock: -1 };
        break;
      default:
        sort = { date_creation: -1 };
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
    console.error('Erreur produits boutique gérant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Gérant: Uploader plusieurs images pour un produit
// ============================================
exports.uploadImagesProduit = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    console.log(`📸 Upload de ${req.files.length} image(s) pour le produit ${id}`);

    // Récupérer le produit
    const produit = await Produit.findById(id).populate('boutique');
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique._id.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }

    // Limiter le nombre total d'images (par exemple, max 5)
    const MAX_IMAGES = 5;
    if (produit.images.length + req.files.length > MAX_IMAGES) {
      return res.status(400).json({
        success: false,
        message: `Vous ne pouvez pas avoir plus de ${MAX_IMAGES} images. Actuellement: ${produit.images.length}`
      });
    }

    // ✅ Construire les URLs des nouvelles images avec Cloudinary
    const nouvellesImages = req.files.map((file, index) => ({
      url: file.path, // URL Cloudinary complète
      ordre: produit.images.length + index,
      is_principale: produit.images.length === 0 && index === 0 // La première devient principale si aucune
    }));

    // ✅ Afficher les URLs Cloudinary pour vérification
    console.log('☁️ URLs Cloudinary:', nouvellesImages.map(img => img.url));

    // Ajouter au produit
    produit.images.push(...nouvellesImages);
    await produit.save();

    res.status(200).json({
      success: true,
      message: `${req.files.length} image(s) uploadée(s) avec succès`,
      images: produit.images
    });

  } catch (error) {
    console.error('❌ Erreur upload images produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des images',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Supprimer image produit
// ============================================
exports.supprimerImageProduit = async (req, res) => {
  try {
    const { imageId } = req.params;
    const produitId = req.params.produitId;

    console.log(`🗑️ Suppression image ${imageId} du produit ${produitId}`);

    const produit = await Produit.findById(produitId);
    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }

    // Trouver l'image à supprimer
    const image = produit.images.find(img => img._id.toString() === imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image non trouvée'
      });
    }

    // ✅ 1. Supprimer l'image de Cloudinary
    console.log('☁️ Suppression de Cloudinary:', image.url);
    await deleteImageByUrl(image.url);

    // ✅ 2. Supprimer l'image du tableau
    const imageIndex = produit.images.findIndex(img => img._id.toString() === imageId);
    produit.images.splice(imageIndex, 1);
    
    // ✅ 3. Réorganiser les ordres
    produit.images.forEach((img, index) => {
      img.ordre = index;
      if (index === 0) {
        img.is_principale = true;
      } else {
        img.is_principale = false;
      }
    });
    
    await produit.save();

    console.log(`✅ Image supprimée avec succès. Reste: ${produit.images.length} image(s)`);

    res.status(200).json({
      success: true,
      message: 'Image supprimée avec succès',
      images: produit.images
    });
  } catch (error) {
    console.error('❌ Erreur suppression image produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Gérant: Activer/Désactiver un produit
// ============================================
exports.toggleActivationProduit = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le produit
    const produit = await Produit.findById(id).populate('boutique');

    if (!produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !produit.boutique._id.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier ce produit'
      });
    }

    // Inverser le statut actif
    produit.est_actif = !produit.est_actif;
    await produit.save();

    res.status(200).json({
      success: true,
      message: `Produit ${produit.est_actif ? 'activé' : 'désactivé'} avec succès`,
      produit: {
        id: produit._id,
        nom: produit.nom,
        est_actif: produit.est_actif
      }
    });

  } catch (error) {
    console.error('Erreur activation/désactivation produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du statut du produit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};