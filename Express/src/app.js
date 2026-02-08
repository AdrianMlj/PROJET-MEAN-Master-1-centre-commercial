const express = require('express');
const app = express();

// Import des routes
const authRoutes = require('./routes/auth.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const boutiqueRoutes = require('./routes/boutique.routes');
const categorieBoutiqueRoutes = require('./routes/categorieBoutique.routes');
const produitRoutes = require('./routes/produit.routes');
const panierRoutes = require('./routes/panier.routes');
const commandeRoutes = require('./routes/commande.routes');
const statistiquesRoutes = require('./routes/statistiques.routes');

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des routes
app.use('/api/auth', authRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/categories-boutique', categorieBoutiqueRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/panier', panierRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/statistiques', statistiquesRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Commerce M1P13 2026 fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;