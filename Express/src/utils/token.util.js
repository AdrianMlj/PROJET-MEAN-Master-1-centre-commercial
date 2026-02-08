const jwt = require("jsonwebtoken");
const { secret, expire } = require("../config/jwt");

exports.genererToken = (payload) => {
  return jwt.sign(payload, secret, { expiresIn: expire });
};

exports.verifierToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};