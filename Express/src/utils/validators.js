exports.validerEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.validerTelephone = (telephone) => {
  const regex = /^[0-9+\-\s()]{10,20}$/;
  return regex.test(telephone);
};

exports.validerMotDePasse = (password) => {
  return password.length >= 6;
};

exports.validerNom = (nom) => {
  return nom && nom.length >= 2 && nom.length <= 50;
};

exports.validerPrix = (prix) => {
  return !isNaN(prix) && prix >= 0;
};

exports.validerQuantite = (quantite) => {
  return !isNaN(quantite) && quantite >= 0;
};