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