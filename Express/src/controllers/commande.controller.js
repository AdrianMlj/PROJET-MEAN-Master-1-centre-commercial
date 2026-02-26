const Commande = require('../models/commande.model');
const CommandeDetail = require('../models/commandeDetail.model');
const CommandeStatutHistorique = require('../models/commandeStatutHistorique.model');
const Panier = require('../models/panier.model');
const Produit = require('../models/produit.model');
const Boutique = require('../models/boutique.model');
const Paiement = require('../models/paiement.model');
const mongoose = require('mongoose');
const { genererNumeroCommande } = require('../utils/generateur');
const Notification = require('../models/notification.model');
const PDFDocument = require('pdfkit');
const { genererReferencePaiement } = require('../utils/generateur');

// ============================================
// Passer une commande (sans création de paiement)
// ============================================
exports.passerCommande = async (req, res) => {
  try {
    const { 
      adresse_livraison, 
      mode_livraison, 
      notes 
    } = req.body;

    // Validation
    if (!adresse_livraison ||  !adresse_livraison.rue || !adresse_livraison.ville || !adresse_livraison.code_postal) {
      return res.status(400).json({
        success: false,
        message: 'Adresse de livraison incomplète'
      });
    }

    // Récupérer le panier de l'utilisateur
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

    // Grouper les éléments par boutique
    const elementsParBoutique = {};
    const erreurs = [];

    for (const element of panier.elements) {
      if (!element.produit || !element.produit.est_actif || !element.produit.boutique.est_active) {
        erreurs.push(`Le produit "${element.produit?.nom || 'Inconnu'}" n'est plus disponible`);
        continue;
      }

      if (element.produit.quantite_stock < element.quantite) {
        erreurs.push(`Stock insuffisant pour "${element.produit.nom}". Disponible: ${element.produit.quantite_stock}, Demandé: ${element.quantite}`);
        continue;
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

    // Créer une commande par boutique
    const commandesCreees = [];

    for (const boutiqueId in elementsParBoutique) {
      const { boutique, elements, total } = elementsParBoutique[boutiqueId];

      // Calcul des frais de livraison
      const seuilLivraisonGratuite = boutique.parametres?.livraison_gratuite_apres || 50;
      const frais_livraison = total >= seuilLivraisonGratuite ? 0 : (boutique.parametres?.frais_livraison || 5);
      const total_general = total + frais_livraison;

      // Créer la commande (sans informations de paiement)
      const nouvelleCommande = new Commande({
        numero_commande: genererNumeroCommande(),
        client: req.user.id,
        boutique: boutique._id,
        total_commande: total,
        frais_livraison,
        total_general,
        adresse_livraison,
        mode_livraison: mode_livraison || 'livraison_standard',
        notes
        // pas d'informations_paiement
      });

      const commandeSauvee = await nouvelleCommande.save();

      // Créer les détails de commande
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

      await CommandeDetail.insertMany(detailsCommande);

      // Créer l'historique de statut
      const historique = new CommandeStatutHistorique({
        commande: commandeSauvee._id,
        nouveau_statut: 'en_attente',
        utilisateur_modif: req.user.id
      });
      await historique.save();

      // ✅ NOTIFICATION POUR LA BOUTIQUE
      try {
        const notification = new Notification({
          destinataire: boutique.gerant,
          type: 'commande',
          titre: 'Nouvelle commande reçue',
          message: `Vous avez reçu une nouvelle commande (${elements.length} article(s)) d'un montant total de ${total_general.toFixed(2)} €.`,
          donnees: {
            commandeId: commandeSauvee._id,
            numeroCommande: commandeSauvee.numero_commande,
            boutiqueId: boutique._id,
            articles: elements.map(e => ({
              nom: e.nom_produit,
              quantite: e.quantite,
              prix_unitaire: e.prix_unitaire,
              sous_total: e.sous_total
            })),
            total: total_general,
            clientId: req.user.id,
            adresseLivraison: adresse_livraison
          }
        });
        await notification.save();
      } catch (notifError) {
        console.error('Erreur notification boutique:', notifError);
      }

      // Mettre à jour le stock des produits
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

      // Mettre à jour les statistiques de la boutique
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

    // Vider le panier
    panier.elements = [];
    await panier.save();

    res.status(201).json({
      success: true,
      message: 'Commande(s) passée(s) avec succès',
      commandes: commandesCreees,
      nombre_commandes: commandesCreees.length
    });

  } catch (error) {
    console.error('Erreur passage commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du passage de commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      message: 'Erreur lors de la récupération des commandes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Gérant: Obtenir les commandes de sa boutique
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
    
    // Recherche par numéro de commande ou nom client
    if (recherche) {
      // Recherche par numéro de commande
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
      message: 'Erreur lors de la récupération des commandes de la boutique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtenir les détails d'une commande
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
    console.error('Erreur détail commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Gérant: Mettre à jour le statut d'une commande (avec notifications)
// ============================================
exports.mettreAJourStatutCommande = async (req, res) => {
  try {
    const { nouveau_statut, raison } = req.body;

    if (!nouveau_statut || !['en_preparation', 'pret', 'livre', 'annule', 'refuse'].includes(nouveau_statut)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const commande = await Commande.findById(req.params.id)
      .populate('boutique')
      .populate('client', 'nom prenom email'); // ✅ pour récupérer les infos du client

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le gérant de la boutique
    const boutique = await Boutique.findOne({ gerant: req.user.id });
    if (!boutique || !commande.boutique._id.equals(boutique._id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à modifier cette commande'
      });
    }

    const ancienStatut = commande.statut;

    // Valider la transition de statut
    const transitionsValides = {
      'en_attente': ['en_preparation', 'annule', 'refuse','pret'],
      'en_preparation': ['pret', 'annule'],
      'pret': ['livre', 'annule'],
      'livre': [],
      'annule': [],
      'refuse': []
    };

    if (!transitionsValides[ancienStatut]?.includes(nouveau_statut)) {
      return res.status(400).json({
        success: false,
        message: `Transition de statut invalide: ${ancienStatut} -> ${nouveau_statut}`
      });
    }

    // Mettre à jour le statut
    commande.statut = nouveau_statut;
    commande.date_modification_statut = new Date();
    await commande.save();

    // Créer l'historique
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut,
      utilisateur_modif: req.user.id,
      raison: raison || `Statut changé par ${req.user.nom}`
    });
    await historique.save();

    // Si la commande est annulée ou refusée, remettre les produits en stock
    if (nouveau_statut === 'annule' || nouveau_statut === 'refuse') {
      const details = await CommandeDetail.find({ commande: commande._id });
      for (const detail of details) {
        await Produit.findByIdAndUpdate(
          detail.produit,
          { $inc: { 'quantite_stock': detail.quantite } }
        );
      }
      // Mettre à jour le statut du paiement si existant
      await Paiement.findOneAndUpdate(
        { commande: commande._id },
        { statut_paiement: 'rembourse' }
      );
    }

    // ✅ NOTIFICATION POUR L'ACHETEUR (statut 'pret')
    if (nouveau_statut === 'pret') {
      try {
        const notification = new Notification({
          destinataire: commande.client._id,
          type: 'commande',
          titre: 'Commande prête à être payée',
          message: `Votre commande ${commande.numero_commande} est maintenant prête. Veuillez procéder au paiement.`,
          donnees: {
            commandeId: commande._id,
            numeroCommande: commande.numero_commande,
            montant: commande.total_general
          }
        });
        await notification.save();
      } catch (notifError) {
        console.error('Erreur notification client (pret):', notifError);
      }
    }

    // ✅ NOUVELLE NOTIFICATION POUR L'ACHETEUR (statut 'livre')
    if (nouveau_statut === 'livre') {
      try {
        const notification = new Notification({
          destinataire: commande.client._id,
          type: 'commande',
          titre: 'Commande livrée',
          message: `Votre commande ${commande.numero_commande} a été marquée comme livrée. Merci de votre achat !`,
          donnees: {
            commandeId: commande._id,
            numeroCommande: commande.numero_commande,
            dateLivraison: new Date()
          }
        });
        await notification.save();
      } catch (notifError) {
        console.error('Erreur notification client (livraison):', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: `Statut de la commande mis à jour: ${nouveau_statut}`,
      commande
    });

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de la commande',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Obtenir l'historique des statuts d'une commande
exports.obtenirHistoriqueStatuts = async (req, res) => {
  try {
    // Vérifier que l'utilisateur a accès à cette commande
    const commande = await Commande.findById(req.params.id);
    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    const boutique = await Boutique.findOne({ gerant: req.user.id });
    
    if (req.user.role === 'acheteur' && !commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir cette commande'
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
      message: 'Erreur lors de la récupération de l\'historique',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Client: Annuler une commande (avec notification boutique)
// ============================================
exports.annulerCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id).populate('boutique');

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le client de la commande
    if (!commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à annuler cette commande'
      });
    }

    // Vérifier que la commande peut être annulée
    if (!['en_attente', 'en_preparation'].includes(commande.statut)) {
      return res.status(400).json({
        success: false,
        message: `La commande ne peut pas être annulée dans son état actuel: ${commande.statut}`
      });
    }

    const ancienStatut = commande.statut;
    commande.statut = 'annule';
    commande.date_modification_statut = new Date();
    await commande.save();

    // Créer l'historique de statut
    const historique = new CommandeStatutHistorique({
      commande: commande._id,
      ancien_statut: ancienStatut,
      nouveau_statut: 'annule',
      utilisateur_modif: req.user.id,
      raison: 'Annulée par le client'
    });
    await historique.save();

    // Remettre les produits en stock
    const details = await CommandeDetail.find({ commande: commande._id });
    for (const detail of details) {
      await Produit.findByIdAndUpdate(
        detail.produit,
        { $inc: { quantite_stock: detail.quantite } }
      );
    }

    // Mettre à jour le statut du paiement (si existant)
    await Paiement.findOneAndUpdate(
      { commande: commande._id },
      { statut_paiement: 'rembourse' }
    );

    // ✅ NOTIFICATION À LA BOUTIQUE
    try {
      if (commande.boutique && commande.boutique.gerant) {
        const Notification = require('../models/notification.model');
        const notification = new Notification({
          destinataire: commande.boutique.gerant,
          type: 'commande',
          titre: 'Commande annulée',
          message: `La commande ${commande.numero_commande} a été annulée par le client.`,
          donnees: {
            commandeId: commande._id,
            numeroCommande: commande.numero_commande,
            clientId: req.user.id,
            ancienStatut,
            raison: 'Annulée par le client'
          }
        });
        await notification.save();
      }
    } catch (notifError) {
      console.error('Erreur notification boutique (annulation):', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Commande annulée avec succès',
      commande
    });

  } catch (error) {
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
      message: 'Erreur lors de la récupération des commandes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Client: Payer une commande après confirmation boutique
// ============================================
exports.payerCommande = async (req, res) => {
  try {
    const { id } = req.params;
    const { methode_paiement, token_paiement } = req.body; // token_paiement simulé ou réel

    // 1. Récupérer la commande
    const commande = await Commande.findById(id);
    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // 2. Vérifier que l'utilisateur est le client
    if (!commande.client.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à payer cette commande'
      });
    }

    // 3. Vérifier que la commande est dans un état permettant le paiement (ex: 'pret')
    if (commande.statut !== 'pret') {
      return res.status(400).json({
        success: false,
        message: `La commande doit être au statut 'pret' pour être payée (actuel: ${commande.statut})`
      });
    }

    // 4. Simuler un paiement (ici vous intégrerez Stripe ou autre)
    // Pour l'exemple, on suppose que le paiement réussit
    const paiementReussi = true;

    if (!paiementReussi) {
      return res.status(400).json({
        success: false,
        message: 'Le paiement a échoué'
      });
    }

    // 5. Créer le document Paiement
    const Paiement = require('../models/paiement.model');
    const nouveauPaiement = new Paiement({
      commande: commande._id,
      montant: commande.total_general,
      methode_paiement: methode_paiement || 'carte_credit',
      statut_paiement: 'paye',
      date_paiement: new Date(),
      reference_paiement: genererReferencePaiement()
    });
    await nouveauPaiement.save();

    // 6. Mettre à jour la commande avec les infos de paiement
    commande.informations_paiement = {
      methode: methode_paiement,
      statut: 'paye',
      reference: nouveauPaiement.reference_paiement,
      date_paiement: new Date()
    };
    // Optionnel : changer le statut de la commande (ex: 'payee' ou garder 'pret')
    // commande.statut = 'payee'; // si vous voulez un statut distinct
    await commande.save();

    // 7. Notification à la boutique
    try {
      const boutique = await Boutique.findById(commande.boutique);
      if (boutique) {
        const Notification = require('../models/notification.model');
        const notification = new Notification({
          destinataire: boutique.gerant,
          type: 'commande',
          titre: 'Paiement reçu',
          message: `Le client a payé la commande ${commande.numero_commande}.`,
          donnees: {
            commandeId: commande._id,
            numeroCommande: commande.numero_commande,
            montant: commande.total_general
          }
        });
        await notification.save();
      }
    } catch (notifError) {
      console.error('Erreur notification boutique (paiement):', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Paiement effectué avec succès',
      commande: {
        id: commande._id,
        numero: commande.numero_commande,
        statut: commande.statut,
        paiement: commande.informations_paiement
      }
    });

  } catch (error) {
    console.error('Erreur paiement commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Générer la facture PDF d'une commande (design moderne et clair)
// ============================================
exports.genererFacturePDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la commande avec les informations nécessaires
    const commande = await Commande.findById(id)
      .populate('client', 'nom prenom email telephone adresse') // ✅ ajout du téléphone
      .populate({
        path: 'boutique',
        select: 'nom adresse contact gerant'
      })
      .populate({
        path: 'details',
        populate: {
          path: 'produit',
          select: 'nom'
        }
      });

    if (!commande) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier les droits : client, admin ou gérant de la boutique
    const estClient = commande.client._id.equals(req.user.id);
    const estAdmin = req.user.role === 'admin_centre';
    const estGerant = commande.boutique.gerant && commande.boutique.gerant.equals(req.user.id);

    if (!estClient && !estAdmin && !estGerant) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir cette facture'
      });
    }

    const paiement = await Paiement.findOne({ commande: commande._id });

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      layout: 'portrait'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${commande.numero_commande}.pdf`);
    doc.pipe(res);

    // Couleurs
    const primaryColor = '#2c3e50';
    const secondaryColor = '#7f8c8d';
    const accentColor = '#3498db';
    const lightGray = '#ecf0f1';
    const borderColor = '#bdc3c7';
    const lineHeight = 18;

    // En-tête
    doc.fontSize(24).fillColor(primaryColor).text('FACTURE', 50, 50);
    doc.moveDown(0.5);
    doc.strokeColor(accentColor).lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Bloc informations commande (deux colonnes)
    const startY = doc.y;
    const col1X = 50;
    const col2X = 300;

    doc.fontSize(10).fillColor(secondaryColor);
    doc.text('Numéro de commande :', col1X, startY);
    doc.text('Date de commande :', col1X, startY + lineHeight);
    doc.text('Statut :', col1X, startY + 2 * lineHeight);

    doc.fillColor(primaryColor);
    doc.text(commande.numero_commande, col1X + 120, startY);
    doc.text(new Date(commande.date_commande).toLocaleDateString('fr-FR'), col1X + 120, startY + lineHeight);
    doc.text(commande.informations_paiement.statut, col1X + 120, startY + 2 * lineHeight);

    doc.fillColor(secondaryColor);
    doc.text('Mode de livraison :', col2X, startY);
    doc.text('Adresse de livraison :', col2X, startY + lineHeight);

    doc.fillColor(primaryColor);
    doc.text(commande.mode_livraison, col2X + 120, startY);
    const adresseLivraison = `${commande.adresse_livraison.rue} ${commande.adresse_livraison.complement || ''}, ${commande.adresse_livraison.code_postal} ${commande.adresse_livraison.ville}`;
    doc.text(adresseLivraison, col2X + 120, startY + lineHeight, { width: 200 });

    doc.moveDown(4);

    // Bloc client (avec téléphone)
    const clientY = doc.y;
    doc.fontSize(12).fillColor(primaryColor).text('Client', 50, clientY);
    doc.moveDown(0.5);
    const clientInfoY = doc.y;
    doc.fontSize(10).fillColor(secondaryColor).text('Nom :', 50, clientInfoY);
    doc.fillColor(primaryColor).text(`${commande.client.nom} ${commande.client.prenom}`, 150, clientInfoY);
    doc.fillColor(secondaryColor).text('Email :', 50, clientInfoY + lineHeight);
    doc.fillColor(primaryColor).text(commande.client.email, 150, clientInfoY + lineHeight);

    let ligneCourante = 2; // on a déjà 2 lignes (nom, email)

    if (commande.client.adresse) {
      const adresseClient = `${commande.client.adresse.rue}, ${commande.client.adresse.code_postal} ${commande.client.adresse.ville}, ${commande.client.adresse.pays}`;
      doc.fillColor(secondaryColor).text('Adresse :', 50, clientInfoY + ligneCourante * lineHeight);
      doc.fillColor(primaryColor).text(adresseClient, 150, clientInfoY + ligneCourante * lineHeight);
      ligneCourante++;
    }

    if (commande.client.telephone) {
      doc.fillColor(secondaryColor).text('Téléphone :', 50, clientInfoY + ligneCourante * lineHeight);
      doc.fillColor(primaryColor).text(commande.client.telephone, 150, clientInfoY + ligneCourante * lineHeight);
      ligneCourante++;
    }

    doc.moveDown(3);

    // Tableau des articles
    doc.fontSize(12).fillColor(primaryColor).text('Détail des articles', 50, doc.y);
    doc.moveDown(1);

    const tableTop = doc.y;
    const colProduit = 60;
    const colQte = 250;
    const colPrix = 320;
    const colTotal = 450;

    // En-tête tableau
    doc.rect(50, tableTop - 5, 500, 20).fill(lightGray).stroke();
    doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10);
    doc.text('Produit', colProduit, tableTop);
    doc.text('Qté', colQte, tableTop);
    doc.text('Prix unitaire', colPrix, tableTop);
    doc.text('Sous-total', colTotal, tableTop);
    doc.font('Helvetica');

    let y = tableTop + 20;
    for (const detail of commande.details) {
      doc.fillColor(primaryColor).text(detail.nom_produit, colProduit, y, { width: 180 });
      doc.fillColor(primaryColor).text(detail.quantite.toString(), colQte, y);
      doc.fillColor(primaryColor).text(`${detail.prix_unitaire.toFixed(2)} €`, colPrix, y);
      doc.fillColor(primaryColor).text(`${detail.sous_total.toFixed(2)} €`, colTotal, y);
      y += 20;
    }

    // Ligne après les articles
    doc.strokeColor(borderColor).lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Totaux alignés à droite
    doc.fontSize(10).fillColor(secondaryColor).text('Sous-total :', 350, y);
    doc.fillColor(primaryColor).text(`${commande.total_commande.toFixed(2)} €`, 480, y);
    y += 20;
    doc.fillColor(secondaryColor).text('Frais de livraison :', 350, y);
    doc.fillColor(primaryColor).text(`${commande.frais_livraison.toFixed(2)} €`, 480, y);
    y += 20;
    doc.fontSize(12).fillColor(primaryColor).text('TOTAL :', 350, y);
    doc.fillColor(primaryColor).text(`${commande.total_general.toFixed(2)} €`, 480, y);
    y += 30;

    // Bloc paiement
    if (paiement && paiement.statut_paiement === 'paye') {
      doc.fontSize(12).fillColor(primaryColor).text('Paiement', 50, y);
      doc.moveDown(0.5);
      const paiementY = doc.y;
      doc.fontSize(10).fillColor(secondaryColor).text('Méthode :', 50, paiementY);
      doc.fillColor(primaryColor).text(paiement.methode_paiement, 150, paiementY);
      doc.fillColor(secondaryColor).text('Référence :', 50, paiementY + lineHeight);
      doc.fillColor(primaryColor).text(paiement.reference_paiement || 'Non disponible', 150, paiementY + lineHeight);
      doc.fillColor(secondaryColor).text('Date :', 50, paiementY + 2 * lineHeight);
      doc.fillColor(primaryColor).text(new Date(paiement.date_paiement).toLocaleDateString('fr-FR'), 150, paiementY + 2 * lineHeight);
    }

    // Pied de page
    doc.fontSize(9).fillColor(secondaryColor).text('Merci de votre achat !', 50, 750, { align: 'center', width: 500 });

    doc.end();

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};