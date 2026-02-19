require("dotenv").config();
const express = require("express");
const app = require("./app");
const connectDB = require("./config/database");
const cors = require('cors');

// Connexion à MongoDB
connectDB();

const server = express();

// ✅ Configuration CORS pour accepter votre frontend Render
const allowedOrigins = [
  'http://localhost:4200',
  'https://projet-mean-master-1-centre-commercial-1.onrender.com',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_RENDER_URL
].filter(Boolean); // Enlève les valeurs null/undefined

console.log('🌍 Origines autorisées CORS:', allowedOrigins);

// Middleware CORS global
server.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Middleware pour parser le JSON
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Vos routes
server.use(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📁 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 API disponible sur: http://localhost:${PORT}/api`);
  console.log(`🌍 Frontend autorisés: ${allowedOrigins.join(', ')}`);
});