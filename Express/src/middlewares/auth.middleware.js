const { verifierToken } = require("../utils/token.util");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: "Token d'authentification manquant" 
    });
  }

  const token = authHeader.split(' ')[1];

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