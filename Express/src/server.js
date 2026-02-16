const path = require("path");
const result = require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
if (result.error) {
  console.error("❌ Erreur loading .env:", result.error.message);
} else if (Object.keys(result.parsed || {}).length === 0) {
  console.warn("⚠️ Warning: .env file loaded but no variables found");
} else {
  console.log("✅ .env loaded successfully:", Object.keys(result.parsed).length, "variables");
}

// Charger la configuration de la base de données AVANT les modèles
require("./config/database");

const express = require("express");
const app = require("./app");

// Connexion à MongoDB
const connectDB = require("./config/database");
connectDB();

const server = express();

// Configuration CORS supplémentaire
server.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes(process.env.FRONTEND_URL || 'http://localhost:4200'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

server.use(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📁 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`👤 JWT Secret: ${process.env.JWT_SECRET ? '✓ Configuré' : '✗ Non configuré'}`);
});