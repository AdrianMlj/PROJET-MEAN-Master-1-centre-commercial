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
  let etape = 'initialisation';
  try {
    const {
      adresse_livraison,
      mode_livraison,
      notes,
      methode_paiement
    } = req.body;

    // Validation
    if (!adresse_livraison || !adresse_livraison.nom_complet || !adresse_livraison.telephone ||
        !adresse_livraison.rue || !adresse_livraison.ville || !adresse_livraison.code_postal) {
      return res.status(400).json({
        success: false,
        message: 'Adresse de livraison incomplete'
      });
    }

    if (!methode_paiement || !['carte_credit', 'especes', 'virement', 'mobile', 'carte_bancaire'].includes(methode_paiement)) {
      return res.status(400).json({
        success: false,
        message: 'Methode de paiement invalide'
      });
    }

    // Recuperer le panier de l'utilisateur
    etape = 'chargement_panier';
    const panier = await Panier.findOne({ client: req.user.id })
      .populate({
        path: 'elements.produit',
        populate: { path: 'boutique' }
      });

    if (!panier || panier.elements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Votre panier est vide'
      });
    }

    // Grouper les elements par boutique
    const elementsParBoutique = {};
    const erreurs = [];

    etape = 'validation_panier';
    for (const element of panier.elements) {
      const boutiqueProduit = element.produit?.boutique;
      if (!element.produit || !boutiqueProduit || !element.produit.est_actif || !boutiqueProduit.est_active) {
        erreurs.push(`Le produit "${element.produit?.nom || 'Inconnu'}" n'est plus disponible`);
        continue;
      }

      // Verifier le stock
      if (element.produit.quantite_stock < element.quantite) {
        erreurs.push(`Stock insuffisant pour "${element.produit.nom}". Disponible: ${element.produit.quantite_stock}, Demande: ${element.quantite}`);
        continue;
      }

      const boutiqueId = boutiqueProduit._id.toString();

      if (!elementsParBoutique[boutiqueId]) {
        elementsParBoutique[boutiqueId] = {
          boutique: boutiqueProduit,
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
        image_produit: element.produit.images?.[0]?.url || null,
        caracteristiques: element.produit.caracteristiques || []
      });

      elementsParBoutique[boutiqueId].total += prixProduit * element.quantite;
    }

    if (erreurs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de passer la commande',
        erreurs
      });
    }

    if (Object.keys(elementsParBoutique).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun produit valide dans votre panier'
      });
    }

    const commandesCreees = [];

    etape = 'creation_commandes';
    for (const boutiqueId in elementsParBoutique) {
      const { boutique, elements, total } = elementsParBoutique[boutiqueId];

      const seuilLivraisonGratuite = boutique.parametres?.livraison_gratuite_apres || 50;
      const fraisLivraison = total >= seuilLivraisonGratuite
        ? 0
        : (boutique.parametres?.frais_livraison || 5);

      const totalGeneral = total + fraisLivraison;

      const nouvelleCommande = new Commande({
        client: req.user.id,
        boutique: boutique._id,
        total_commande: total,
        frais_livraison: fraisLivraison,
        total_general: totalGeneral,
        adresse_livraison,
        mode_livraison: mode_livraison || 'livraison_standard',
        notes,
        informations_paiement: {
          methode: methode_paiement,
          statut: 'en_attente'
        }
      });

      etape = 'sauvegarde_commande';
      const commandeSauvee = await nouvelleCommande.save();

      const detailsCommande = elements.map(element => ({
        commande: commandeSauvee._id,
        produit: element.produit,
        quantite: element.quantite,
        prix_unitaire: element.prix_unitaire,
        sous_total: element.sous_total,
        nom_produit: element.nom_produit,
        image_produit: element.image_produit,
        caracteristiques: element.caracteristiques
      }));

      etape = 'sauvegarde_details';
      await CommandeDetail.insertMany(detailsCommande);

      const historique = new CommandeStatutHistorique({
        commande: commandeSauvee._id,
        nouveau_statut: 'en_attente',
        utilisateur_modif: req.user.id
      });
      etape = 'sauvegarde_historique';
      await historique.save();

      const paiement = new Paiement({
        commande: commandeSauvee._id,
        montant: totalGeneral,
        methode_paiement: methode_paiement,
        statut_paiement: 'en_attente'
      });
      etape = 'sauvegarde_paiement';
      await paiement.save();

      etape = 'mise_a_jour_stock';
      for (const element of elements) {
        await Produit.findByIdAndUpdate(
          element.produit,
          {
            $inc: {
              'quantite_stock': -element.quantite,
              'statistiques.nombre_ventes': element.quantite
            }
          }
        );
      }

      etape = 'mise_a_jour_boutique';
      await Boutique.findByIdAndUpdate(
        boutique._id,
        {
          $inc: {
            'statistiques.commandes_traitees': 1,
            'statistiques.produits_vendus': elements.reduce((sum, el) => sum + el.quantite, 0)
          }
        }
      );

      commandesCreees.push(commandeSauvee);
    }

    panier.elements = [];
    etape = 'vidage_panier';
    await panier.save();

    res.status(201).json({
      success: true,
      message: 'Commande(s) passee(s) avec succes',
      commandes: commandesCreees,
      nombre_commandes: commandesCreees.length
    });
  } catch (error) {
    console.error('Erreur passage commande:', { etape, message: error?.message, code: error?.code, stack: error?.stack });

    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors || {})[0]?.message || 'Donnees de commande invalides'
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Conflit de donnees (doublon). Veuillez reessayer.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors du passage de commande',
      etape,
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};
// Client: Obtenir ses commandes
exports.obtenirCommandesClient = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10, date_debut, date_fin } = req.query;
    
    const query = { client: req.user.id };
    
    if (statut) {
      query.statut = statut;
    }
    
    if (date_debut || date_fin) {
      query.date_commande = {};
      if (date_debut) {
        query.date_commande.$gte = new Date(date_debut);
      }
      if (date_fin) {
        query.date_fin = new Date(date_fin);
        query.date_fin.setHours(23, 59, 59, 999);
        query.date_commande.$lte = query.date_fin;
      }
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
    console.error('Erreur commandes client:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration des commandes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GÃ©rant: Obtenir les commandes de sa boutique
exports.obtenirCommandesBoutique = async (req, res) => {
  try {
    // VÃ©rifier que l'utilisateur est un gÃ©rant de boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique) {
      return res.status(403).json({
        success: false,
        message: 'Vous devez Ãªtre gÃ©rant d\'une boutique pour voir ses commandes'
      });
    }

    const { statut, page = 1, limit = 10, date_debut, date_fin, recherche } = req.query;
    
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
        query.date_fin = new Date(date_fin);
        query.date_fin.setHours(23, 59, 59, 999);
        query.date_commande.$lte = query.date_fin;
      }
    }
    
    // Recherche par numÃ©ro de commande ou nom client
    if (recherche) {
      // Recherche par numÃ©ro de commande
      if (recherche.startsWith('CMD-')) {
        query.numero_commande = { $regex: recherche, $options: 'i' };
      } else {
        // Recherche par client (via lookup)
        const utilisateurs = await require('../models/utilisateur.model').find({
          $or: [
            { nom: { $regex: recherche, $options: 'i' } },
            { prenom: { $regex: recherche, $options: 'i' } },
            { email: { $regex: recherche, $options: 'i' } }
          ]
        }).select('_id');
        
        query.client = { $in: utilisateurs.map(u => u._id) };
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
    console.error('Erreur commandes boutique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration des commandes de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les dÃ©tails d'une commande
exports.obtenirDetailCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id)
      .populate('client', 'nom prenom email telephone')
      .populate('boutique', 'nom logo_url contact adresse')
      .populate({
        path: 'details',
        populate: {
          path: 'produit',
          select: 'nom images description'
        }
      });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvÃ©e'
      });
    }

    // VÃ©rifier les permissions
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (req.user.role === 'acheteur' && !commande.client._id.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  voir cette commande'
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
    console.error('Erreur dÃ©tail commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration des dÃ©tails de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// GÃ©rant: Mettre Ã  jour le statut d'une commande
exports.mettreAJourStatutCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { nouveau_statut, raison } = req.body;

    if (!nouveau_statut || !['en_preparation', 'pret', 'livre', 'annule', 'refuse'].includes(nouveau_statut)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const commande = await Commande.findById(req.params.id)
      .populate('boutique')
      .session(session);

    if (!commande) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvÃ©e'
      });
    }

    // VÃ©rifier que l'utilisateur est le gÃ©rant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !commande.boutique._id.equals(boutique._id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  modifier cette commande'
      });
    }

    const ancienStatut = commande.statut;

    // Valider la transition de statut
    const transitionsValides = {
      'en_attente': ['en_preparation', 'annule', 'refuse'],
      'en_preparation': ['pret', 'annule'],
      'pret': ['livre', 'annule'],
      'livre': [],
      'annule': [],
      'refuse': []
    };

    if (!transitionsValides[ancienStatut]?.includes(nouveau_statut)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Transition de statut invalide: ${ancienStatut} -> ${nouveau_statut}`
      });
    }

    // Mettre Ã  jour le statut
    commande.statut = nouveau_statut;
    commande.date_modification_statut = new Date();
    await commande.save({ session });

    // CrÃ©er l'historique
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut,
      utilisateur_modif: req.user.id,
      raison: raison || `Statut changÃ© par ${req.user.nom}`
    });

    await historique.save({ session });

    // Si la commande est annulÃ©e ou refusÃ©e, remettre les produits en stock
    if (nouveau_statut === 'annule' || nouveau_statut === 'refuse') {
      const details = await CommandeDetail.find({ commande: commande._id }).session(session);
      
      for (const detail of details) {
        await Produit.findByIdAndUpdate(
          detail.produit,
          { $inc: { 'quantite_stock': detail.quantite } },
          { session }
        );
      }
      
      // Mettre Ã  jour le paiement
      await Paiement.findOneAndUpdate(
        { commande: commande._id },
        { statut_paiement: 'rembourse' },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: `Statut de la commande mis Ã  jour: ${nouveau_statut}`,
      commande
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Erreur mise Ã  jour statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise Ã  jour du statut de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir l'historique des statuts d'une commande
exports.obtenirHistoriqueStatuts = async (req, res) => {
  try {
    // VÃ©rifier que l'utilisateur a accÃ¨s Ã  cette commande
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvÃ©e'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (req.user.role === 'acheteur' && !commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  voir cette commande'
      });
    }

    if (req.user.role === 'boutique' && boutique && !commande.boutique.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cette commande ne vous appartient pas'
      });
    }

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
    console.error('Erreur historique commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration de l\'historique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Client: Annuler une commande
exports.annulerCommande = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const commande = await Commande.findById(req.params.id).session(session);

    if (!commande) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvÃ©e'
      });
    }

    // VÃ©rifier que l'utilisateur est le client de la commande
    if (!commande.client.equals(req.user.id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Vous n\'Ãªtes pas autorisÃ© Ã  annuler cette commande'
      });
    }

    // VÃ©rifier que la commande peut Ãªtre annulÃ©e
    if (!['en_attente', 'en_preparation'].includes(commande.statut)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `La commande ne peut pas Ãªtre annulÃ©e dans son Ã©tat actuel: ${commande.statut}`
      });
    }

    // Annuler la commande
    const ancienStatut = commande.statut;
    commande.statut = 'annule';
    commande.date_modification_statut = new Date();
    await commande.save({ session });

    // CrÃ©er l'historique
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut: 'annule',
      utilisateur_modif: req.user.id,
      raison: 'AnnulÃ©e par le client'
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

    // Mettre Ã  jour le statut du paiement
    await Paiement.findOneAndUpdate(
      { commande: commande._id },
      { statut_paiement: 'rembourse' },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Commande annulÃ©e avec succÃ¨s',
      commande
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Erreur annulation commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Obtenir toutes les commandes
exports.obtenirToutesCommandes = async (req, res) => {
  try {
    const { statut, page = 1, limit = 10, date_debut, date_fin, boutique, client } = req.query;
    
    const query = {};
    
    if (statut) {
      query.statut = statut;
    }
    
    if (boutique) {
      query.boutique = boutique;
    }
    
    if (client) {
      query.client = client;
    }
    
    if (date_debut || date_fin) {
      query.date_commande = {};
      if (date_debut) {
        query.date_commande.$gte = new Date(date_debut);
      }
      if (date_fin) {
        query.date_fin = new Date(date_fin);
        query.date_fin.setHours(23, 59, 59, 999);
        query.date_commande.$lte = query.date_fin;
      }
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'boutique', select: 'nom' },
        { path: 'client', select: 'nom prenom email' }
      ],
      sort: { date_commande: -1 }
    };
    
    const commandes = await Commande.paginate(query, options);
    
    res.status(200).json({
      success: true,
      ...commandes
    });
  } catch (error) {
    console.error('Erreur toutes commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la rÃ©cupÃ©ration des commandes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
