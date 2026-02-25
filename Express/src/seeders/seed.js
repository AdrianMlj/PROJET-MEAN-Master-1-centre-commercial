const mongoose = require('mongoose');
const Role = require('../models/role.model');
const CategorieBoutique = require('../models/categorieBoutique.model');
const { hasher } = require('../utils/password.util');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB pour le seeding');

    // Créer les rôles
    const roles = [
      { 
        nom_role: 'admin_centre', 
        description: 'Administrateur du centre commercial - Super administrateur de toute la plateforme',
        permissions: [
          'gestion_boutiques', 
          'gestion_utilisateurs', 
          'gestion_commandes',
          'gestion_categories',
          'voir_statistiques',
          'moderer_avis'
        ]
      },
      { 
        nom_role: 'boutique', 
        description: 'Gérant d\'une boutique spécifique',
        permissions: [
          'gestion_produits',
          'gestion_commandes_boutique',
          'voir_statistiques_boutique',
          'repondre_avis',
          'gestion_profil_boutique'
        ]
      },
      { 
        nom_role: 'acheteur', 
        description: 'Client final qui achète dans le centre commercial',
        permissions: [
          'voir_boutiques',
          'voir_produits',
          'gestion_panier',
          'passer_commande',
          'voir_commandes',
          'laisser_avis',
          'gestion_favoris',
          'gestion_profil'
        ]
      }
    ];

    await Role.deleteMany({});
    await Role.insertMany(roles);
    console.log('✅ Rôles créés');

    // Créer les catégories de boutiques
    const categories = [
      { nom_categorie: 'Mode & Vêtements', icone: '👕', description: 'Vêtements, chaussures et accessoires' },
      { nom_categorie: 'Electronique', icone: '📱', description: 'Appareils électroniques et gadgets' },
      { nom_categorie: 'Alimentation', icone: '🍕', description: 'Restaurants, épiceries et snacks' },
      { nom_categorie: 'Beauté & Santé', icone: '💄', description: 'Cosmétiques, produits de beauté et santé' },
      { nom_categorie: 'Maison & Déco', icone: '🏠', description: 'Meubles et articles de décoration' },
      { nom_categorie: 'Sport & Loisirs', icone: '⚽', description: 'Articles de sport et loisirs' },
      { nom_categorie: 'Livres & Papeterie', icone: '📚', description: 'Librairies et papeteries' },
      { nom_categorie: 'Jouets & Enfants', icone: '🧸', description: 'Jouets et articles pour enfants' }
    ];

    await CategorieBoutique.deleteMany({});
    await CategorieBoutique.insertMany(categories);
    console.log('✅ Catégories de boutiques créées');

    // Créer un utilisateur admin par défaut
    const Utilisateur = require('../models/utilisateur.model');
    await Utilisateur.deleteMany({ email: 'admin@commerce.com' });

    const roleAdmin = await Role.findOne({ nom_role: 'admin_centre' });
    const motDePasseHash = await hasher('admin123');

    const admin = new Utilisateur({
      email: 'admin@commerce.com',
      mot_de_passe_hash: motDePasseHash,
      nom: 'Admin',
      prenom: 'System',
      role: roleAdmin._id,
      est_actif: true,
      verifie_email: true
    });

    await admin.save();
    console.log('✅ Admin créé: admin@commerce.com / admin123');

    // Créer un utilisateur boutique par défaut
    const roleBoutique = await Role.findOne({ nom_role: 'boutique' });
    const motDePasseHashBoutique = await hasher('boutique123');

    const boutiqueUser = new Utilisateur({
      email: 'boutique@commerce.com',
      mot_de_passe_hash: motDePasseHashBoutique,
      nom: 'Boutique',
      prenom: 'Test',
      role: roleBoutique._id,
      est_actif: true,
      verifie_email: true
    });

    await boutiqueUser.save();
    console.log('✅ Utilisateur boutique créé: boutique@commerce.com / boutique123');

    // Créer un utilisateur acheteur par défaut
    const roleAcheteur = await Role.findOne({ nom_role: 'acheteur' });
    const motDePasseHashAcheteur = await hasher('acheteur123');

    const acheteur = new Utilisateur({
      email: 'acheteur@commerce.com',
      mot_de_passe_hash: motDePasseHashAcheteur,
      nom: 'Acheteur',
      prenom: 'Test',
      role: roleAcheteur._id,
      est_actif: true,
      verifie_email: true
    });

    await acheteur.save();
    console.log('✅ Utilisateur acheteur créé: acheteur@commerce.com / acheteur123');

    console.log('✅ Données initiales créées avec succès');
    console.log('\n📋 Comptes de test:');
    console.log('👑 Admin: admin@commerce.com / admin123');
    console.log('🏪 Boutique: boutique@commerce.com / boutique123');
    console.log('🛒 Acheteur: acheteur@commerce.com / acheteur123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
};

seedData();