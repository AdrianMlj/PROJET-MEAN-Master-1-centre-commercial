-- ============================================
-- 1. Table des rôles
-- ============================================
CREATE TABLE role (
    id_role INT PRIMARY KEY AUTO_INCREMENT,
    nom_role VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. Table des utilisateurs
-- ============================================
CREATE TABLE utilisateur (
    id_utilisateur INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50),
    telephone VARCHAR(20),
    adresse TEXT,
    id_role INT NOT NULL,
    est_actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL,
    FOREIGN KEY (id_role) REFERENCES role(id_role)
);

-- ============================================
-- 3. Table des catégories de boutiques
-- ============================================
CREATE TABLE categorie_boutique (
    id_categorie INT PRIMARY KEY AUTO_INCREMENT,
    nom_categorie VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icone VARCHAR(50),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. Table des boutiques
-- ============================================
CREATE TABLE boutique (
    id_boutique INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    id_categorie INT NOT NULL,
    logo_url VARCHAR(255),
    id_gerant INT NOT NULL UNIQUE, -- Utilisateur avec rôle "boutique"
    est_active BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL,
    FOREIGN KEY (id_categorie) REFERENCES categorie_boutique(id_categorie),
    FOREIGN KEY (id_gerant) REFERENCES utilisateur(id_utilisateur)
);

-- ============================================
-- 5. Table des catégories de produits
-- ============================================
CREATE TABLE categorie_produit (
    id_categorie_produit INT PRIMARY KEY AUTO_INCREMENT,
    nom_categorie VARCHAR(100) NOT NULL,
    description TEXT,
    id_boutique INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_boutique) REFERENCES boutique(id_boutique),
    UNIQUE KEY unique_categorie_boutique (nom_categorie, id_boutique)
);

-- ============================================
-- 6. Table des produits
-- ============================================
CREATE TABLE produit (
    id_produit INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(200) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2) NOT NULL CHECK (prix >= 0),
    quantite_stock INT NOT NULL DEFAULT 0 CHECK (quantite_stock >= 0),
    image_url VARCHAR(255),
    id_categorie_produit INT,
    id_boutique INT NOT NULL,
    est_actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL,
    FOREIGN KEY (id_categorie_produit) REFERENCES categorie_produit(id_categorie_produit),
    FOREIGN KEY (id_boutique) REFERENCES boutique(id_boutique)
);

-- ============================================
-- 7. Table des paniers (panier actif)
-- ============================================
CREATE TABLE panier (
    id_panier INT PRIMARY KEY AUTO_INCREMENT,
    id_client INT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP NULL,
    FOREIGN KEY (id_client) REFERENCES utilisateur(id_utilisateur),
    UNIQUE KEY unique_panier_client (id_client)
);

-- ============================================
-- 8. Table des éléments du panier
-- ============================================
CREATE TABLE panier_element (
    id_panier_element INT PRIMARY KEY AUTO_INCREMENT,
    id_panier INT NOT NULL,
    id_produit INT NOT NULL,
    quantite INT NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10,2) NOT NULL, -- Prix au moment de l'ajout au panier
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_panier) REFERENCES panier(id_panier) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES produit(id_produit),
    UNIQUE KEY unique_produit_panier (id_panier, id_produit)
);

-- ============================================
-- 9. Table des commandes
-- ============================================
CREATE TABLE commande (
    id_commande INT PRIMARY KEY AUTO_INCREMENT,
    numero_commande VARCHAR(50) UNIQUE NOT NULL, -- Format: CMD-YYYYMMDD-XXXXX
    id_client INT NOT NULL,
    id_boutique INT NOT NULL,
    statut ENUM('en_attente', 'en_preparation', 'pret', 'livre', 'annule') DEFAULT 'en_attente',
    total_commande DECIMAL(10,2) NOT NULL CHECK (total_commande >= 0),
    adresse_livraison TEXT,
    notes TEXT,
    date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification_statut TIMESTAMP NULL,
    FOREIGN KEY (id_client) REFERENCES utilisateur(id_utilisateur),
    FOREIGN KEY (id_boutique) REFERENCES boutique(id_boutique)
);

-- ============================================
-- 10. Table des détails de commande
-- ============================================
CREATE TABLE commande_detail (
    id_commande_detail INT PRIMARY KEY AUTO_INCREMENT,
    id_commande INT NOT NULL,
    id_produit INT NOT NULL,
    quantite INT NOT NULL CHECK (quantite > 0),
    prix_unitaire DECIMAL(10,2) NOT NULL,
    sous_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_commande) REFERENCES commande(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
);

-- ============================================
-- 11. Table des statuts de commande (historique)
-- ============================================
CREATE TABLE commande_statut_historique (
    id_historique INT PRIMARY KEY AUTO_INCREMENT,
    id_commande INT NOT NULL,
    ancien_statut ENUM('en_attente', 'en_preparation', 'pret', 'livre', 'annule'),
    nouveau_statut ENUM('en_attente', 'en_preparation', 'pret', 'livre', 'annule') NOT NULL,
    id_utilisateur_modif INT, -- Qui a changé le statut
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raison TEXT,
    FOREIGN KEY (id_commande) REFERENCES commande(id_commande),
    FOREIGN KEY (id_utilisateur_modif) REFERENCES utilisateur(id_utilisateur)
);

-- ============================================
-- 12. Table des paiements
-- ============================================
CREATE TABLE paiement (
    id_paiement INT PRIMARY KEY AUTO_INCREMENT,
    id_commande INT NOT NULL UNIQUE,
    montant DECIMAL(10,2) NOT NULL CHECK (montant >= 0),
    methode_paiement ENUM('carte_credit', 'especes', 'virement', 'mobile') NOT NULL,
    statut_paiement ENUM('en_attente', 'paye', 'echec', 'rembourse') DEFAULT 'en_attente',
    reference_paiement VARCHAR(100),
    date_paiement TIMESTAMP NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commande(id_commande)
);

-- ============================================
-- INSERTION DES DONNÉES DE BASE
-- ============================================

-- Insertion des rôles
INSERT INTO role (nom_role, description) VALUES
('admin_centre', 'Administrateur du centre commercial - Super administrateur de toute la plateforme'),
('boutique', 'Gérant d''une boutique spécifique'),
('acheteur', 'Client final qui achète dans le centre commercial');

-- Insertion des catégories de boutiques (exemples)
INSERT INTO categorie_boutique (nom_categorie, description, icone) VALUES
('Mode & Vêtements', 'Boutiques de vêtements, chaussures et accessoires', '🛍️'),
('Electronique', 'Appareils électroniques et gadgets', '📱'),
('Alimentation', 'Restaurants et épiceries', '🍕'),
('Beauté & Santé', 'Cosmétiques, produits de beauté et santé', '💄'),
('Maison & Déco', 'Meubles et articles de décoration', '🏠'),
('Sport & Loisirs', 'Articles de sport et loisirs', '⚽'),
('Livres & Papeterie', 'Librairies et papeteries', '📚'),
('Jouets & Enfants', 'Jouets et articles pour enfants', '🧸');

-- ============================================
-- CRÉATION DES INDEX POUR LES PERFORMANCES
-- ============================================

-- Index pour la table utilisateur
CREATE INDEX idx_utilisateur_role ON utilisateur(id_role);
CREATE INDEX idx_utilisateur_email ON utilisateur(email);

-- Index pour la table boutique
CREATE INDEX idx_boutique_categorie ON boutique(id_categorie);
CREATE INDEX idx_boutique_gerant ON boutique(id_gerant);
CREATE INDEX idx_boutique_active ON boutique(est_active);

-- Index pour la table produit
CREATE INDEX idx_produit_boutique ON produit(id_boutique);
CREATE INDEX idx_produit_categorie ON produit(id_categorie_produit);
CREATE INDEX idx_produit_actif ON produit(est_actif);

-- Index pour la table panier
CREATE INDEX idx_panier_client ON panier(id_client);

-- Index pour la table commande
CREATE INDEX idx_commande_client ON commande(id_client);
CREATE INDEX idx_commande_boutique ON commande(id_boutique);
CREATE INDEX idx_commande_statut ON commande(statut);
CREATE INDEX idx_commande_date ON commande(date_commande);

-- Index pour la table commande_detail
CREATE INDEX idx_commande_detail_commande ON commande_detail(id_commande);
CREATE INDEX idx_commande_detail_produit ON commande_detail(id_produit);

-- ============================================
-- VUES UTILES POUR LES STATISTIQUES
-- ============================================

-- Vue pour les statistiques globales (Admin)
CREATE VIEW vue_statistiques_globales AS
SELECT 
    (SELECT COUNT(*) FROM boutique) AS total_boutiques,
    (SELECT COUNT(*) FROM boutique WHERE est_active = TRUE) AS boutiques_actives,
    (SELECT COUNT(*) FROM utilisateur WHERE id_role = 3) AS total_acheteurs,
    (SELECT COUNT(*) FROM commande) AS total_commandes,
    (SELECT COALESCE(SUM(total_commande), 0) FROM commande WHERE statut = 'livre') AS chiffre_affaires_total,
    (SELECT b.nom FROM boutique b 
     JOIN commande c ON b.id_boutique = c.id_boutique 
     WHERE c.statut = 'livre'
     GROUP BY b.id_boutique 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) AS boutique_plus_active;

-- Vue pour les statistiques par boutique
CREATE VIEW vue_statistiques_boutique AS
SELECT 
    b.id_boutique,
    b.nom AS nom_boutique,
    COUNT(DISTINCT c.id_commande) AS nombre_commandes,
    COALESCE(SUM(CASE WHEN c.statut = 'livre' THEN c.total_commande ELSE 0 END), 0) AS chiffre_affaires,
    COUNT(DISTINCT c.id_client) AS clients_uniques,
    AVG(CASE WHEN c.statut = 'livre' THEN c.total_commande END) AS panier_moyen
FROM boutique b
LEFT JOIN commande c ON b.id_boutique = c.id_boutique
GROUP BY b.id_boutique;

-- Vue pour les produits les plus vendus
CREATE VIEW vue_produits_plus_vendus AS
SELECT 
    p.id_produit,
    p.nom AS nom_produit,
    b.nom AS nom_boutique,
    SUM(cd.quantite) AS quantite_vendue,
    SUM(cd.sous_total) AS chiffre_affaires_produit
FROM produit p
JOIN boutique b ON p.id_boutique = b.id_boutique
JOIN commande_detail cd ON p.id_produit = cd.id_produit
JOIN commande c ON cd.id_commande = c.id_commande
WHERE c.statut = 'livre'
GROUP BY p.id_produit, p.nom, b.nom
ORDER BY quantite_vendue DESC;

-- ============================================
-- PROCÉDURES STOCKÉES UTILES
-- ============================================

-- Procédure pour passer une commande
DELIMITER //
CREATE PROCEDURE passer_commande(
    IN p_id_client INT,
    IN p_id_boutique INT,
    IN p_adresse_livraison TEXT,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_numero_commande VARCHAR(50);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_id_commande INT;
    DECLARE v_id_panier INT;
    
    -- Générer numéro de commande
    SET v_numero_commande = CONCAT('CMD-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'));
    
    -- Calculer le total du panier
    SELECT SUM(pe.quantite * pe.prix_unitaire) INTO v_total
    FROM panier p
    JOIN panier_element pe ON p.id_panier = pe.id_panier
    WHERE p.id_client = p_id_client;
    
    -- Créer la commande
    INSERT INTO commande (numero_commande, id_client, id_boutique, total_commande, adresse_livraison, notes)
    VALUES (v_numero_commande, p_id_client, p_id_boutique, v_total, p_adresse_livraison, p_notes);
    
    SET v_id_commande = LAST_INSERT_ID();
    
    -- Copier les éléments du panier vers les détails de commande
    INSERT INTO commande_detail (id_commande, id_produit, quantite, prix_unitaire, sous_total)
    SELECT 
        v_id_commande,
        pe.id_produit,
        pe.quantite,
        pe.prix_unitaire,
        pe.quantite * pe.prix_unitaire
    FROM panier p
    JOIN panier_element pe ON p.id_panier = pe.id_panier
    WHERE p.id_client = p_id_client;
    
    -- Vider le panier
    SELECT id_panier INTO v_id_panier FROM panier WHERE id_client = p_id_client;
    DELETE FROM panier_element WHERE id_panier = v_id_panier;
    DELETE FROM panier WHERE id_panier = v_id_panier;
    
    -- Créer l'historique de statut
    INSERT INTO commande_statut_historique (id_commande, nouveau_statut, id_utilisateur_modif)
    VALUES (v_id_commande, 'en_attente', p_id_client);
    
    -- Créer l'enregistrement de paiement
    INSERT INTO paiement (id_commande, montant, methode_paiement, statut_paiement)
    VALUES (v_id_commande, v_total, 'en_attente', 'en_attente');
    
    SELECT v_id_commande AS id_commande, v_numero_commande AS numero_commande;
END //
DELIMITER ;

-- Procédure pour mettre à jour le stock après commande
DELIMITER //
CREATE PROCEDURE mettre_a_jour_stock_commande(
    IN p_id_commande INT
)
BEGIN
    UPDATE produit p
    JOIN commande_detail cd ON p.id_produit = cd.id_produit
    SET p.quantite_stock = p.quantite_stock - cd.quantite
    WHERE cd.id_commande = p_id_commande;
END //
DELIMITER ;