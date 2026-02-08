const Commande = require('../models/commande.model');
const CommandeDetail = require('../models/commandeDetail.model');
const CommandeStatutHistorique = require('../models/commandeStatutHistorique.model');
const Panier = require('../models/panier.model');
const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');
const Paiement = require('../models/paiement.model');
const mongoose = require('mongoose');

// Passer une commande
exports.passerCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      adresse_livraison, 
      mode_livraison, 
      notes, 
      methode_paiement 
    } = req.body;

    // Récupérer le panier de l'utilisateur
    const panier = await Panier.findOne({ client: req.user.id })
      .populate({
        path: 'elements.produit',
        populate: { path: 'boutique' }
      })
      .session(session);

    if (!panier || panier.elements.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Votre panier est vide'
      });
    }

    // Grouper les éléments par boutique
    const elementsParBoutique = {};
    
    for (const element of panier.elements) {
      if (!element.produit || !element.produit.est_actif || !element.produit.boutique.est_active) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Certains produits ne sont plus disponibles'
        });
      }

      // Vérifier le stock
      if (element.produit.quantite_stock < element.quantite) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour le produit "${element.produit.nom}"`
        });
      }

      const boutiqueId = element.produit.boutique._id.toString();
      
      if (!elementsParBoutique[boutiqueId]) {
        elementsParBoutique[boutiqueId] = {
          boutique: element.produit.boutique,
          elements: [],
          total: 0
        };
      }
      
      const prixProduit = element.produit.en_promotion && element.produit.prix_promotion 
        ? element.produit.prix_promotion 
        : element.produit.prix;
      
      elementsParBoutique[boutiqueId].elements.push({
        produit: element.produit._id,
        quantite: element.quantite,
        prix_unitaire: prixProduit,
        sous_total: prixProduit * element.quantite,
        nom_produit: element.produit.nom,
        image_produit: element.produit.images?.[0]?.url || null
      });
      
      elementsParBoutique[boutiqueId].total += prixProduit * element.quantite;
    }

    // Créer une commande par boutique
    const commandesCreees = [];
    
    for (const boutiqueId in elementsParBoutique) {
      const { boutique, elements, total } = elementsParBoutique[boutiqueId];
      
      // Calculer les frais de livraison
      const seuilLivraisonGratuite = boutique.parametres.livraison_gratuite_apres || 50;
      const fraisLivraison = total >= seuilLivraisonGratuite 
        ? 0 
        : (boutique.parametres.frais_livraison || 5);
      
      const totalGeneral = total + fraisLivraison;

      // Créer la commande
      const nouvelleCommande = new Commande({
        client: req.user.id,
        boutique: boutique._id,
        total_commande: total,
        frais_livraison,
        total_general,
        adresse_livraison,
        mode_livraison,
        notes,
        informations_paiement: {
          methode: methode_paiement,
          statut: 'en_attente'
        }
      });

      const commandeSauvee = await nouvelleCommande.save({ session });

      // Créer les détails de commande
      const detailsCommande = elements.map(element => ({
        commande: commandeSauvee._id,
        produit: element.produit,
        quantite: element.quantite,
        prix_unitaire: element.prix_unitaire,
        sous_total: element.sous_total,
        nom_produit: element.nom_produit,
        image_produit: element.image_produit
      }));

      await CommandeDetail.insertMany(detailsCommande, { session });

      // Créer l'historique de statut
      const historique = new CommandeStatutHistorique({
        commande: commandeSauvee._id,
        nouveau_statut: 'en_attente',
        utilisateur_modif: req.user.id
      });

      await historique.save({ session });

      // Créer l'enregistrement de paiement
      const paiement = new Paiement({
        commande: commandeSauvee._id,
        montant: totalGeneral,
        methode_paiement: methode_paiement,
        statut_paiement: 'en_attente'
      });

      await paiement.save({ session });

      // Mettre à jour le stock des produits
      for (const element of elements) {
        await Produit.findByIdAndUpdate(
          element.produit,
          { 
            $inc: { 
              'quantite_stock': -element.quantite,
              'statistiques.nombre_ventes': element.quantite
            } 
          },
          { session }
        );
      }

      // Mettre à jour les statistiques de la boutique
      await Boutique.findByIdAndUpdate(
        boutique._id,
        { 
          $inc: { 
            'statistiques.commandes_traitees': 1 
          } 
        },
        { session }
      );

      commandesCreees.push(commandeSauvee);
    }

    // Vider le panier
    panier.elements = [];
    await panier.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Commande(s) passée(s) avec succès',
      commandes: commandesCreees
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du passage de commande',
      error: error.message
    });
  }
};

// Obtenir les commandes d'un client
exports.obtenirCommandesClient = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10 } = req.query;
    
    const query = { client: req.user.id };
    
    if (statut) {
      query.statut = statut;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'boutique', select: 'nom logo_url' }
      ],
      sort: { date_commande: -1 }
    };
    
    const commandes = await Commande.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...commandes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: error.message
    });
  }
};

// Obtenir les commandes d'une boutique (pour les gérants)
exports.obtenirCommandesBoutique = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est un gérant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez être gérant d\'une boutique pour voir ses commandes'
      });
    }

    const { statut, page = 1, limit = 10, date_debut, date_fin } = req.query;
    
    const query = { boutique: boutique._id };
    
    if (statut) {
      query.statut = statut;
    }
    
    if (date_debut || date_fin) {
      query.date_commande = {};
      if (date_debut) {
        query.date_commande.$gte = new Date(date_debut);
      }
      if (date_fin) {
        query.date_commande.$lte = new Date(date_fin);
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'client', select: 'nom prenom email telephone' }
      ],
      sort: { date_commande: -1 }
    };
    
    const commandes = await Commande.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...commandes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes de la boutique',
      error: error.message
    });
  }
};

// Obtenir les détails d'une commande
exports.obtenirDetailCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('client', 'nom prenom email telephone')
      .populate('boutique', 'nom logo_url contact')
      .populate({
        path: 'details',
        populate: {
          path: 'produit',
          select: 'nom images'
        }
      });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier les permissions
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (req.user.role === 'acheteur' && !commande.client._id.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir cette commande'
      });
    }

    if (req.user.role === 'boutique' && boutique && !commande.boutique._id.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cette commande ne vous appartient pas'
      });
    }

    res.status(200).json({
      success: true,
      commande
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de la commande',
      error: error.message
    });
  }
};

// Mettre à jour le statut d'une commande (pour les boutiques)
exports.mettreAJourStatutCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { nouveau_statut, raison } = req.body;

    const commande = await Commande.findById(req.params.id)
      .populate('boutique')
      .session(session);

    if (!commande) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !commande.boutique._id.equals(boutique._id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette commande'
      });
    }

    const ancienStatut = commande.statut;

    // Valider la transition de statut
    const transitionsValides = {
      'en_attente': ['en_preparation', 'annule', 'refuse'],
      'en_preparation': ['pret', 'annule'],
      'pret': ['livre'],
      'livre': [],
      'annule': [],
      'refuse': []
    };

    if (!transitionsValides[ancienStatut].includes(nouveau_statut)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Transition de statut invalide: ${ancienStatut} -> ${nouveau_statut}`
      });
    }

    // Mettre à jour le statut
    commande.statut = nouveau_statut;
    commande.date_modification_statut = new Date();
    await commande.save({ session });

    // Créer l'historique
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut,
      utilisateur_modif: req.user.id,
      raison
    });

    await historique.save({ session });

    // Si la commande est annulée, remettre les produits en stock
    if (nouveau_statut === 'annule') {
      const details = await CommandeDetail.find({ commande: commande._id }).session(session);
      
      for (const detail of details) {
        await Produit.findByIdAndUpdate(
          detail.produit,
          { $inc: { 'quantite_stock': detail.quantite } },
          { session }
        );
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Statut de la commande mis à jour: ${nouveau_statut}`,
      commande
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de la commande',
      error: error.message
    });
  }
};

// Obtenir l'historique des statuts d'une commande
exports.obtenirHistoriqueStatuts = async (req, res) => {
  try {
    const historique = await CommandeStatutHistorique.find({ 
      commande: req.params.id 
    })
    .populate('utilisateur_modif', 'nom prenom')
    .sort({ date_modification: -1 });

    res.status(200).json({
      success: true,
      historique
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

// Annuler une commande (pour les clients)
exports.annulerCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const commande = await Commande.findById(req.params.id).session(session);

    if (!commande) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le client de la commande
    if (!commande.client.equals(req.user.id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler cette commande'
      });
    }

    // Vérifier que la commande peut être annulée
    if (!['en_attente', 'en_preparation'].includes(commande.statut)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `La commande ne peut pas être annulée dans son état actuel: ${commande.statut}`
      });
    }

    // Annuler la commande
    const ancienStatut = commande.statut;
    commande.statut = 'annule';
    commande.date_modification_statut = new Date();
    await commande.save({ session });

    // Créer l'historique
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut: 'annule',
      utilisateur_modif: req.user.id,
      raison: 'Annulée par le client'
    });

    await historique.save({ session });

    // Remettre les produits en stock
    const details = await CommandeDetail.find({ commande: commande._id }).session(session);
    
    for (const detail of details) {
      await Produit.findByIdAndUpdate(
        detail.produit,
        { $inc: { 'quantite_stock': detail.quantite } },
        { session }
      );
    }

    // Mettre à jour le statut du paiement
    await Paiement.findOneAndUpdate(
      { commande: commande._id },
      { statut_paiement: 'rembourse' },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Commande annulée avec succès',
      commande
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la commande',
      error: error.message
    });
  }
};