require("dotenv").config();
const express = require("express");
const app = require("./app");
const connectDB = require("./config/database");
const cors = require('cors'); 

// Connexion à MongoDB
connectDB();

const server = express();

// ✅ Configuration CORS avec le package officiel (plus fiable)
const allowedOrigins = [
  'https://m1p13mean-adrianno-maressah-1.onrender.com',
  'https://m1p13mean-adrianno-maressah-2.onrender.com',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL2
].filter(Boolean);

console.log('🌐 URLs autorisées CORS:', allowedOrigins);

// Middleware CORS - Doit être le PREMIER middleware
server.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS accepté pour:', origin);
      return callback(null, true);
    } else {
      console.log('❌ CORS rejeté pour:', origin);
      return callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}));

// Middleware pour parser le JSON (après CORS)
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Middleware de logging (optionnel)
server.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Vos routes
server.use(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
  console.log(`📁 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS configuré pour: ${allowedOrigins.join(', ')}`);
});