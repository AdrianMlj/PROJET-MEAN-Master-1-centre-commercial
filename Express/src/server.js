require("dotenv").config();
const express = require("express");
const app = require("./app");
const connectDB = require("./config/database");

// Connexion à MongoDB
connectDB();

const server = express();

// Configuration CORS supplémentaire
server.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes(process.env.FRONTEND_URL || 'https://projet-mean-master-1-centre-commercial-1.onrender.com'))) {
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