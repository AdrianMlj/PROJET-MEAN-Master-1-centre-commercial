Table role {
  id_role integer [primary key, increment]
  nom_role varchar(50) [not null, unique]
  description text
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    nom_role
  }
}

// ============================================
// TABLE DES UTILISATEURS
// ============================================
Table utilisateur {
  id_utilisateur integer [primary key, increment]
  email varchar(100) [not null, unique]
  mot_de_passe_hash varchar(255) [not null]
  nom varchar(50) [not null]
  prenom varchar(50)
  telephone varchar(20)
  adresse text
  id_role integer [not null]
  est_actif boolean [default: true]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  date_modification timestamp [null]
  
  indexes {
    id_role
    email
    est_actif
  }
}

// ============================================
// TABLE DES CATÉGORIES DE BOUTIQUES
// ============================================
Table categorie_boutique {
  id_categorie integer [primary key, increment]
  nom_categorie varchar(100) [not null, unique]
  description text
  icone varchar(50)
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
}

// ============================================
// TABLE DES BOUTIQUES
// ============================================
Table boutique {
  id_boutique integer [primary key, increment]
  nom varchar(100) [not null]
  description text
  id_categorie integer [not null]
  logo_url varchar(255)
  id_gerant integer [not null, unique]
  est_active boolean [default: true]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  date_modification timestamp [null]
  
  indexes {
    id_categorie
    id_gerant
    est_active
  }
}

// ============================================
// TABLE DES CATÉGORIES DE PRODUITS
// ============================================
Table categorie_produit {
  id_categorie_produit integer [primary key, increment]
  nom_categorie varchar(100) [not null]
  description text
  id_boutique integer [not null]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    id_boutique
    (nom_categorie, id_boutique) [unique]
  }
}

// ============================================
// TABLE DES PRODUITS
// ============================================
Table produit {
  id_produit integer [primary key, increment]
  nom varchar(200) [not null]
  description text
  prix decimal(10,2) [not null]
  quantite_stock integer [not null, default: 0]
  image_url varchar(255)
  id_categorie_produit integer [null]
  id_boutique integer [not null]
  est_actif boolean [default: true]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  date_modification timestamp [null]
  
  indexes {
    id_boutique
    id_categorie_produit
    est_actif
  }
}

// ============================================
// TABLE DES PANIERS
// ============================================
Table panier {
  id_panier integer [primary key, increment]
  id_client integer [not null]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  date_modification timestamp [null]
  
  indexes {
    id_client [unique]
  }
}

// ============================================
// TABLE DES ÉLÉMENTS DU PANIER
// ============================================
Table panier_element {
  id_panier_element integer [primary key, increment]
  id_panier integer [not null]
  id_produit integer [not null]
  quantite integer [not null]
  prix_unitaire decimal(10,2) [not null]
  date_ajout timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    (id_panier, id_produit) [unique]
    id_produit
  }
}

// ============================================
// TABLE DES COMMANDES
// ============================================
Table commande {
  id_commande integer [primary key, increment]
  numero_commande varchar(50) [not null, unique]
  id_client integer [not null]
  id_boutique integer [not null]
  statut varchar(20) [note: 'en_attente, en_preparation, pret, livre, annule']
  total_commande decimal(10,2) [not null]
  adresse_livraison text
  notes text
  date_commande timestamp [default: `CURRENT_TIMESTAMP`]
  date_modification_statut timestamp [null]
  
  indexes {
    id_client
    id_boutique
    statut
    date_commande
  }
}

// ============================================
// TABLE DES DÉTAILS DE COMMANDE
// ============================================
Table commande_detail {
  id_commande_detail integer [primary key, increment]
  id_commande integer [not null]
  id_produit integer [not null]
  quantite integer [not null]
  prix_unitaire decimal(10,2) [not null]
  sous_total decimal(10,2) [not null]
  
  indexes {
    id_commande
    id_produit
  }
}

// ============================================
// TABLE DES STATUTS DE COMMANDE (HISTORIQUE)
// ============================================
Table commande_statut_historique {
  id_historique integer [primary key, increment]
  id_commande integer [not null]
  ancien_statut varchar(20) [note: 'en_attente, en_preparation, pret, livre, annule']
  nouveau_statut varchar(20) [not null, note: 'en_attente, en_preparation, pret, livre, annule']
  id_utilisateur_modif integer [null]
  date_modification timestamp [default: `CURRENT_TIMESTAMP`]
  raison text
  
  indexes {
    id_commande
    date_modification
  }
}

// ============================================
// TABLE DES PAIEMENTS
// ============================================
Table paiement {
  id_paiement integer [primary key, increment]
  id_commande integer [not null, unique]
  montant decimal(10,2) [not null]
  methode_paiement varchar(20) [note: 'carte_credit, especes, virement, mobile']
  statut_paiement varchar(20) [note: 'en_attente, paye, echec, rembourse']
  reference_paiement varchar(100)
  date_paiement timestamp [null]
  date_creation timestamp [default: `CURRENT_TIMESTAMP`]
  
  indexes {
    id_commande
    statut_paiement
  }
}


// ============================================
// RELATIONS ENTRE LES TABLES
// ============================================

Ref: role.id_role < utilisateur.id_role

Ref: boutique.id_categorie > categorie_boutique.id_categorie
Ref: boutique.id_gerant - utilisateur.id_utilisateur

Ref: categorie_produit.id_boutique > boutique.id_boutique

Ref: produit.id_boutique > boutique.id_boutique
Ref: produit.id_categorie_produit > categorie_produit.id_categorie_produit

Ref: panier.id_client > utilisateur.id_utilisateur

Ref: panier_element.id_panier > panier.id_panier [delete: cascade]
Ref: panier_element.id_produit > produit.id_produit

Ref: commande.id_client > utilisateur.id_utilisateur
Ref: commande.id_boutique > boutique.id_boutique

Ref: commande_detail.id_commande > commande.id_commande [delete: cascade]
Ref: commande_detail.id_produit > produit.id_produit

Ref: commande_statut_historique.id_commande > commande.id_commande
Ref: commande_statut_historique.id_utilisateur_modif > utilisateur.id_utilisateur

Ref: paiement.id_commande > commande.id_commande


Ref: "categorie_boutique"."id_categorie" < "categorie_boutique"."date_creation"