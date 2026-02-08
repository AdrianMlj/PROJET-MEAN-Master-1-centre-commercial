const bcrypt = require("bcryptjs");

exports.hasher = async (motDePasse) => {
  return await bcrypt.hash(motDePasse, 10);
};

exports.comparer = async (motDePasse, hash) => {
  return await bcrypt.compare(motDePasse, hash);
};