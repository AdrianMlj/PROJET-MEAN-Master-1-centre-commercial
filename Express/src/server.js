require("dotenv").config();
const express = require("express");
const cors = require("cors"); 
const app = require("./app");
const connectDB = require("./config/database");

// Connexion à MongoDB
connectDB();

const server = express();

// Configuration CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

server.use(cors(corsOptions));

// Gérer les requêtes preflight
server.options('*', cors(corsOptions));

server.use(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () =>
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`)
);