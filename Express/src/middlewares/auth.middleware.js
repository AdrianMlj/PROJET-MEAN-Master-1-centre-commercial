const { verifierToken } = require("../utils/token.util");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Token d'authentification manquant" 
    });
  }

  try {
    const decoded = verifierToken(token);
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: "Token invalide ou expiré" 
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Erreur d'authentification" 
    });
  }
};