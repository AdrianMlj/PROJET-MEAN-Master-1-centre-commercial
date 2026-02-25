const express = require('express');
const path = require('path');
const cors = require('cors');
const errorMiddleware = require('./middlewares/error.middleware');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const roleRoutes = require('./routes/role.routes');
const utilisateurRoutes = require('./routes/utilisateur.routes');
const boutiqueRoutes = require('./routes/boutique.routes');
const categorieBoutiqueRoutes = require('./routes/categorieBoutique.routes');
const categorieProduitRoutes = require('./routes/categorieProduit.routes');
const produitRoutes = require('./routes/produit.routes');
const panierRoutes = require('./routes/panier.routes');
const commandeRoutes = require('./routes/commande.routes');
const paiementRoutes = require('./routes/paiement.routes');
const statistiquesRoutes = require('./routes/statistiques.routes');
const avisRoutes = require('./routes/avis.routes');
const favorisRoutes = require('./routes/favoris.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Configuration Swagger
const swaggerConfig = require('./config/swagger');
swaggerConfig(app);

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Route d'accueil
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Configuration des routes API
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/categories-boutique', categorieBoutiqueRoutes);
app.use('/api/categories-produit', categorieProduitRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/panier', panierRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/statistiques', statistiquesRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/favoris', favorisRoutes);
app.use('/api/admin', adminRoutes);

// Route de test API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Centre Commercial M1P13 2026 fonctionnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    documentation: 'http://localhost:3000/api-docs'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    available_routes: [
      '/api-docs - Documentation API',
      '/api/health - Health check',
      '/api/auth/* - Authentification',
      '/api/boutiques/* - Boutiques',
      '/api/produits/* - Produits',
      '/api/panier/* - Panier',
      '/api/commandes/* - Commandes',
      '/api/admin/* - Admin',
      '/api/categories-boutique/* - Categorie Boutique',
      '/api/categories-produit/* - Categorie Produit',
      '/api/paiements/* - Paiements',
      '/api/statistiques/* - Statisques',
      '/api/utilisateurs/* - Utilisateurs',
      '/api/avis/* - Avis',
      '/api/favoris/* - Favoris',
      '/api/roles/* - Roles',
    ]
  });
});

// Middleware d'erreur global
app.use(errorMiddleware);

module.exports = app;