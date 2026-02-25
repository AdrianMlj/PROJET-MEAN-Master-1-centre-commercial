const moment = require('moment');

exports.genererNumeroCommande = () => {
  const date = moment().format('YYYYMMDD');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CMD-${date}-${random}`;
};

exports.genererReferencePaiement = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PAY-${timestamp}-${random}`;
};

exports.genererCodeProduit = (boutiqueId) => {
  const timestamp = Date.now().toString().slice(-6);
  const boutiqueCode = boutiqueId.toString().slice(-4).toUpperCase();
  return `PROD-${boutiqueCode}-${timestamp}`;
};

exports.formaterDate = (date) => {
  return moment(date).format('DD/MM/YYYY HH:mm');
};

exports.calculerDateLivraison = (delai) => {
  return moment().add(delai, 'hours').toDate();
};