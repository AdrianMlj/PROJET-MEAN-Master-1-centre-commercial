const { validationResult } = require('express-validator');
const { validerEmail, validerMotDePasse, validerNom, validerPrix } = require('../utils/validators');

exports.validerResultat = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

exports.validerInscription = (req, res, next) => {
  const { email, mot_de_passe, nom, role } = req.body;

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

  if (!nom || !validerNom(nom)) {
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

  next();
};

exports.validerProduit = (req, res, next) => {
  const { nom, prix, quantite_stock } = req.body;

  if (!nom || nom.length < 2 || nom.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Le nom du produit doit contenir entre 2 et 200 caractères'
    });
  }

  if (!prix || !validerPrix(prix)) {
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

  next();
};

exports.validerBoutique = (req, res, next) => {
  const { nom, categorie } = req.body;

  if (!nom || nom.length < 2 || nom.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Le nom de la boutique doit contenir entre 2 et 100 caractères'
    });
  }

  if (!categorie) {
    return res.status(400).json({
      success: false,
      message: 'La catégorie est requise'
    });
  }

  next();
};