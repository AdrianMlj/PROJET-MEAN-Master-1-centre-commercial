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
    if (!adresse_livraison || !adresse_livraison.nom_complet || !adresse_livraison.telephone || 
        !adresse_livraison.rue || !adresse_livraison.ville || !adresse_livraison.code_postal) {
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
// Gérant: Mettre à jour le statut d'une commande (avec notification client)
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

    const commande = await Commande.findById(req.params.id).populate('boutique');

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

    // ✅ Si le nouveau statut est 'pret', notifier l'acheteur
    if (nouveau_statut === 'pret') {
      try {
        const notification = new Notification({
          destinataire: commande.client,
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
        console.error('Erreur notification client:', notifError);
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

// Client: Annuler une commande
exports.annulerCommande = async (req, res) => {
  try {
    const commande = await Commande.findById(req.params.id);

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
      reference: `PAY-${Date.now()}`
    });
    await nouveauPaiement.save();

    // 6. Mettre à jour la commande avec les infos de paiement
    commande.informations_paiement = {
      methode: methode_paiement,
      statut: 'paye',
      reference: nouveauPaiement.reference,
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
// Générer la facture PDF d'une commande
// ============================================
exports.genererFacturePDF = async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la commande avec toutes les informations nécessaires
    const commande = await Commande.findById(id)
      .populate('client', 'nom prenom email adresse')
      .populate('boutique', 'nom adresse contact')
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

    // Vérifier que l'utilisateur est le client ou un admin
    if (req.user.role !== 'admin_centre' && !commande.client._id.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à voir cette facture'
      });
    }

    // Optionnel : vérifier que la commande a été payée
    if (!commande.informations_paiement || commande.informations_paiement.statut !== 'paye') {
      return res.status(400).json({
        success: false,
        message: 'La commande n\'a pas encore été payée'
      });
    }

    // Créer un document PDF
    const doc = new PDFDocument({ margin: 50 });

    // Définir les en-têtes de réponse pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facture-${commande.numero_commande}.pdf`);

    // Pipe le PDF directement dans la réponse
    doc.pipe(res);

    // ---------- Contenu du PDF ----------
    // En-tête
    doc.fontSize(20).text('FACTURE', { align: 'center' });
    doc.moveDown();

    // Informations de la commande
    doc.fontSize(12).text(`Numéro de commande : ${commande.numero_commande}`);
    doc.text(`Date de commande : ${new Date(commande.date_commande).toLocaleDateString('fr-FR')}`);
    doc.text(`Statut : ${commande.statut}`);
    doc.text(`Mode de livraison : ${commande.mode_livraison}`);
    doc.moveDown();

    // Informations client
    doc.fontSize(14).text('Client :', { underline: true });
    doc.fontSize(12).text(`${commande.client.nom} ${commande.client.prenom}`);
    doc.text(`Email : ${commande.client.email}`);
    if (commande.client.adresse) {
      doc.text(`Adresse : ${commande.client.adresse.rue}, ${commande.client.adresse.code_postal} ${commande.client.adresse.ville}, ${commande.client.adresse.pays}`);
    }
    doc.moveDown();

    // Adresse de livraison
    doc.fontSize(14).text('Adresse de livraison :', { underline: true });
    doc.fontSize(12).text(`${commande.adresse_livraison.nom_complet}`);
    doc.text(`${commande.adresse_livraison.rue} ${commande.adresse_livraison.complement || ''}`);
    doc.text(`${commande.adresse_livraison.code_postal} ${commande.adresse_livraison.ville}, ${commande.adresse_livraison.pays}`);
    doc.text(`Tél : ${commande.adresse_livraison.telephone}`);
    if (commande.adresse_livraison.instructions) {
      doc.text(`Instructions : ${commande.adresse_livraison.instructions}`);
    }
    doc.moveDown();

    // Tableau des articles
    doc.fontSize(14).text('Détail des articles :', { underline: true });
    doc.moveDown();

    // En-tête du tableau
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Produit', 50, tableTop);
    doc.text('Qté', 300, tableTop);
    doc.text('Prix unitaire', 350, tableTop);
    doc.text('Sous-total', 450, tableTop);
    doc.font('Helvetica');

    let y = tableTop + 20;
    for (const detail of commande.details) {
      doc.text(detail.nom_produit, 50, y, { width: 240 });
      doc.text(detail.quantite.toString(), 300, y);
      doc.text(`${detail.prix_unitaire.toFixed(2)} €`, 350, y);
      doc.text(`${detail.sous_total.toFixed(2)} €`, 450, y);
      y += 20;
    }

    // Ligne de séparation
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;

    // Totaux
    doc.font('Helvetica-Bold');
    doc.text(`Sous-total : ${commande.total_commande.toFixed(2)} €`, 350, y);
    y += 20;
    doc.text(`Frais de livraison : ${commande.frais_livraison.toFixed(2)} €`, 350, y);
    y += 20;
    doc.fontSize(12).text(`TOTAL : ${commande.total_general.toFixed(2)} €`, 350, y);
    doc.font('Helvetica');

    // Informations de paiement
    if (commande.informations_paiement && commande.informations_paiement.statut === 'paye') {
      y += 30;
      doc.fontSize(14).text('Paiement :', { underline: true });
      doc.fontSize(12).text(`Méthode : ${commande.informations_paiement.methode}`);
      doc.text(`Référence : ${commande.informations_paiement.reference}`);
      doc.text(`Date de paiement : ${new Date(commande.informations_paiement.date_paiement).toLocaleDateString('fr-FR')}`);
    }

    // Pied de page
    doc.fontSize(10).text('Merci de votre achat !', 50, 700, { align: 'center' });

    // Finaliser le PDF
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