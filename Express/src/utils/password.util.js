const bcrypt = require("bcryptjs");

exports.hasher = async (motDePasse) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(motDePasse, salt);
};

exports.comparer = async (motDePasse, hash) => {
  return await bcrypt.compare(motDePasse, hash);
};