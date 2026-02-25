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
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// =============================================
// 1. MIDDLEWARES DE BASE (toujours en premier)
// =============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// 2. CONFIGURATION CORS
// =============================================
const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL || 'https://projet-mean-master-1-centre-commercial-1.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// =============================================
// 3. FICHIERS STATIQUES (CRUCIAL - doit être AVANT les routes API)
// =============================================
// ✅ Chemin corrigé : les fichiers sont dans /Express/uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Optionnel : Pour voir le chemin exact (log de debug)
console.log('📁 Dossier uploads servi depuis:', path.join(__dirname, 'uploads'));

// =============================================
// 4. CONFIGURATION SWAGGER (documentation)
// =============================================
const swaggerConfig = require('./config/swagger');
swaggerConfig(app);

// =============================================
// 5. ROUTES API (tout ce qui commence par /api)
// =============================================
// Route de test API (publique)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Centre Commercial M1P13 2026 fonctionnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    documentation: 'https://projet-mean-master-1-centre-commercial.onrender.com/api-docs'
  });
});

// Routes d'authentification et autres
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
app.use('/api/notifications', notificationRoutes);

// =============================================
// 6. ROUTE D'ACCUEIL (redirection vers documentation)
// =============================================
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// =============================================
// 7. MIDDLEWARE POUR LES FICHIERS STATIQUES DU FRONTEND (si nécessaire)
// =============================================
// Si vous voulez servir des fichiers depuis un dossier 'public'
// app.use(express.static(path.join(__dirname, 'public')));

// =============================================
// 8. ROUTE 404 - DOIT ÊTRE LA DERNIÈRE
// =============================================
app.use('*', (req, res) => {
  // Ne pas intercepter les requêtes vers /uploads (déjà gérées par express.static)
  if (req.originalUrl.startsWith('/uploads')) {
    // Si on arrive ici, c'est que le fichier n'existe pas
    return res.status(404).json({
      success: false,
      message: 'Fichier non trouvé',
      path: req.originalUrl
    });
  }
  
  // Pour toutes les autres routes non trouvées
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
      '/api/statistiques/* - Statistiques',
      '/api/utilisateurs/* - Utilisateurs',
      '/api/avis/* - Avis',
      '/api/favoris/* - Favoris',
      '/api/roles/* - Roles',
      '/api/notifications/* - Notifications'
    ]
  });
});

// =============================================
// 9. MIDDLEWARE D'ERREUR GLOBAL (toujours en dernier)
// =============================================
app.use(errorMiddleware);

module.exports = app;