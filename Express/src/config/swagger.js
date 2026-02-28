const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Centre Commercial M1P13 2026 Adrianno-Maressah',
      version: '1.0.0',
      description: 'Documentation complète de l\'API du centre commercial avec authentification JWT et gestion des rôles',
      contact: {
        name: 'Support Technique',
        email: 'support@commerce-m1p13.com',
        url: 'https://m1p13mean-adrianno-maressah.onrender.com/api'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Serveur de développement local'
      },
      {
        url: ' https://m1p13mean-adrianno-maressah.onrender.com/api',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Entrez le token JWT sous la forme: Bearer <token>'
        }
      },
      schemas: {
        // Utilisateur
        Utilisateur: {
          type: 'object',
          required: ['email', 'nom', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'ID unique de l\'utilisateur',
              example: '507f1f77bcf86cd799439011'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email de l\'utilisateur',
              example: 'utilisateur@example.com'
            },
            nom: {
              type: 'string',
              description: 'Nom de famille',
              example: 'Dupont'
            },
            prenom: {
              type: 'string',
              description: 'Prénom',
              example: 'Jean'
            },
            telephone: {
              type: 'string',
              description: 'Numéro de téléphone',
              example: '+33612345678'
            },
            role: {
              type: 'string',
              enum: ['admin_centre', 'boutique', 'acheteur'],
              description: 'Rôle de l\'utilisateur'
            },
            est_actif: {
              type: 'boolean',
              description: 'Statut d\'activation du compte',
              default: true
            },
            boutique_associee: {
              type: 'string',
              description: 'ID de la boutique associée (pour les gérants)',
              example: '507f1f77bcf86cd799439012'
            },
            date_creation: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création du compte'
            }
          }
        },
        
        // Boutique
        Boutique: {
          type: 'object',
          required: ['nom', 'categorie'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439012'
            },
            nom: {
              type: 'string',
              description: 'Nom de la boutique',
              example: 'La Boutique Moderne'
            },
            description: {
              type: 'string',
              description: 'Description de la boutique',
              example: 'Boutique spécialisée dans les vêtements modernes'
            },
            categorie: {
              type: 'string',
              description: 'ID de la catégorie',
              example: '507f1f77bcf86cd799439013'
            },
            logo_url: {
              type: 'string',
              format: 'uri',
              description: 'URL du logo',
              example: 'https://example.com/logo.png'
            },
            est_active: {
              type: 'boolean',
              description: 'Statut d\'activation',
              default: true
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                telephone: { type: 'string' },
                horaires: { type: 'string' }
              }
            }
          }
        },

            // CatégorieBoutique
            CategorieBoutique: {
            type: 'object',
            required: ['nom_categorie'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439017'
                },
                nom_categorie: {
                type: 'string',
                description: 'Nom de la catégorie',
                example: 'Mode & Vêtements'
                },
                description: {
                type: 'string',
                description: 'Description de la catégorie',
                example: 'Boutiques de vêtements, chaussures et accessoires'
                },
                icone: {
                type: 'string',
                description: 'Icône représentative',
                example: '👕'
                },
                image_url: {
                type: 'string',
                format: 'uri',
                description: 'URL de l\'image de la catégorie'
                },
                est_active: {
                type: 'boolean',
                description: 'Statut d\'activation',
                default: true
                },
                ordre_affichage: {
                type: 'integer',
                description: 'Ordre d\'affichage dans les listes',
                default: 0
                },
                nombre_boutiques: {
                type: 'integer',
                description: 'Nombre de boutiques dans cette catégorie',
                default: 0
                },
                date_creation: {
                type: 'string',
                format: 'date-time',
                description: 'Date de création'
                }
            }
        },
        
        // Produit
        Produit: {
          type: 'object',
          required: ['nom', 'prix', 'boutique'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439014'
            },
            nom: {
              type: 'string',
              description: 'Nom du produit',
              example: 'T-shirt en coton'
            },
            description: {
              type: 'string',
              description: 'Description du produit'
            },
            prix: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Prix du produit',
              example: 29.99
            },
            prix_promotion: {
              type: 'number',
              format: 'float',
              minimum: 0,
              description: 'Prix promotionnel'
            },
            en_promotion: {
              type: 'boolean',
              description: 'Si le produit est en promotion',
              default: false
            },
            quantite_stock: {
              type: 'integer',
              minimum: 0,
              description: 'Quantité en stock',
              default: 0
            },
            est_actif: {
              type: 'boolean',
              description: 'Statut d\'activation',
              default: true
            },
            boutique: {
              type: 'string',
              description: 'ID de la boutique propriétaire'
            }
          }
        },
        
        // CatégorieProduit
        CategorieProduit: {
            type: 'object',
            required: ['nom_categorie', 'boutique'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439017'
                },
                nom_categorie: {
                type: 'string',
                description: 'Nom de la catégorie produit',
                example: 'T-shirts'
                },
                description: {
                type: 'string',
                description: 'Description de la catégorie',
                example: 'Tous nos t-shirts'
                },
                boutique: {
                type: 'string',
                description: 'ID de la boutique propriétaire'
                },
                est_active: {
                type: 'boolean',
                description: 'Statut d\'activation',
                default: true
                },
                ordre_affichage: {
                type: 'integer',
                description: 'Ordre d\'affichage',
                default: 0
                }
            }
        },

        // Commande
        Commande: {
          type: 'object',
          required: ['client', 'boutique', 'total_commande'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439015'
            },
            numero_commande: {
              type: 'string',
              description: 'Numéro unique de commande',
              example: 'CMD-20231201-0001'
            },
            client: {
              type: 'string',
              description: 'ID du client'
            },
            boutique: {
              type: 'string',
              description: 'ID de la boutique'
            },
            statut: {
              type: 'string',
              enum: ['en_attente', 'en_preparation', 'pret', 'livre', 'annule', 'refuse'],
              default: 'en_attente'
            },
            total_commande: {
              type: 'number',
              minimum: 0,
              description: 'Montant total de la commande'
            },
            date_commande: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Panier
        Panier: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439016'
            },
            client: {
              type: 'string',
              description: 'ID du client'
            },
            elements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  produit: { type: 'string' },
                  quantite: { type: 'integer', minimum: 1 },
                  prix_unitaire: { type: 'number', minimum: 0 }
                }
              }
            },
            total: {
              type: 'number',
              minimum: 0,
              description: 'Total calculé du panier'
            }
          }
        },

        // PanierElement
        PanierElement: {
            type: 'object',
            required: ['panier', 'produit', 'quantite', 'prix_unitaire'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439018'
                },
                panier: {
                type: 'string',
                description: 'ID du panier'
                },
                produit: {
                type: 'string',
                description: 'ID du produit'
                },
                quantite: {
                type: 'integer',
                minimum: 1,
                description: 'Quantité du produit',
                example: 2
                },
                prix_unitaire: {
                type: 'number',
                minimum: 0,
                description: 'Prix unitaire au moment de l\'ajout',
                example: 29.99
                },
                sous_total: {
                type: 'number',
                minimum: 0,
                description: 'Sous-total calculé',
                example: 59.98
                }
            }
        },

        // CommandeDetail
        CommandeDetail: {
            type: 'object',
            required: ['commande', 'produit', 'quantite', 'prix_unitaire'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439019'
                },
                commande: {
                type: 'string',
                description: 'ID de la commande'
                },
                produit: {
                type: 'string',
                description: 'ID du produit'
                },
                quantite: {
                type: 'integer',
                minimum: 1,
                description: 'Quantité commandée'
                },
                prix_unitaire: {
                type: 'number',
                minimum: 0,
                description: 'Prix unitaire au moment de la commande'
                },
                sous_total: {
                type: 'number',
                minimum: 0,
                description: 'Sous-total calculé'
                },
                nom_produit: {
                type: 'string',
                description: 'Nom du produit au moment de la commande'
                }
            }
        },

        // Paiement
        Paiement: {
            type: 'object',
            required: ['commande', 'montant', 'methode_paiement'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439020'
                },
                commande: {
                type: 'string',
                description: 'ID de la commande'
                },
                montant: {
                type: 'number',
                minimum: 0,
                description: 'Montant du paiement'
                },
                methode_paiement: {
                type: 'string',
                enum: ['carte_credit', 'especes', 'virement', 'mobile', 'carte_bancaire'],
                description: 'Méthode de paiement utilisée'
                },
                statut_paiement: {
                type: 'string',
                enum: ['en_attente', 'paye', 'echec', 'rembourse', 'partiel'],
                default: 'en_attente',
                description: 'Statut du paiement'
                },
                reference_paiement: {
                type: 'string',
                description: 'Référence unique du paiement'
                },
                date_paiement: {
                type: 'string',
                format: 'date-time',
                description: 'Date du paiement'
                }
            }
        },

        // Avis
        Avis: {
            type: 'object',
            required: ['client', 'note'],
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439021'
                },
                produit: {
                type: 'string',
                description: 'ID du produit (optionnel)'
                },
                boutique: {
                type: 'string',
                description: 'ID de la boutique (optionnel)'
                },
                client: {
                type: 'string',
                description: 'ID du client'
                },
                note: {
                type: 'integer',
                minimum: 1,
                maximum: 5,
                description: 'Note sur 5 étoiles'
                },
                commentaire: {
                type: 'string',
                description: 'Commentaire textuel'
                },
                est_valide: {
                type: 'boolean',
                description: 'Si l\'avis est validé/modéré',
                default: true
                },
                date_creation: {
                type: 'string',
                format: 'date-time',
                description: 'Date de création'
                }
            }
        },

        // Favoris
        Favoris: {
            type: 'object',
            properties: {
                _id: {
                type: 'string',
                example: '507f1f77bcf86cd799439022'
                },
                client: {
                type: 'string',
                description: 'ID du client'
                },
                produit: {
                type: 'string',
                description: 'ID du produit (optionnel)'
                },
                boutique: {
                type: 'string',
                description: 'ID de la boutique (optionnel)'
                },
                date_ajout: {
                type: 'string',
                format: 'date-time',
                description: 'Date d\'ajout aux favoris'
                }
            }
        },
        
        // Erreur
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur',
              example: 'Une erreur est survenue'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        
        // Réponse paginée
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            docs: {
              type: 'array',
              description: 'Liste des documents'
            },
            totalDocs: {
              type: 'integer',
              description: 'Nombre total de documents'
            },
            limit: {
              type: 'integer',
              description: 'Limite par page'
            },
            page: {
              type: 'integer',
              description: 'Page actuelle'
            },
            totalPages: {
              type: 'integer',
              description: 'Nombre total de pages'
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Si une page suivante existe'
            },
            hasPrevPage: {
              type: 'boolean',
              description: 'Si une page précédente existe'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Token d\'authentification manquant ou invalide'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Permissions insuffisantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Permission refusée. Rôle requis: admin_centre'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Ressource non trouvée'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erreur de validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                message: 'Erreur de validation',
                errors: [
                  {
                    field: 'email',
                    message: 'Email invalide'
                  }
                ]
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentification',
        description: 'Endpoints pour l\'inscription, connexion et gestion du compte'
      },
      {
        name: 'Utilisateurs',
        description: 'Gestion des utilisateurs (admin seulement)'
      },
      {
        name: 'Rôles',
        description: 'Gestion des rôles (admin seulement)'
      },
      {
        name: 'Boutiques',
        description: 'Gestion des boutiques'
      },
      {
        name: 'Catégories Boutiques',
        description: 'Gestion des catégories de boutiques'
      },
      {
        name: 'Produits',
        description: 'Gestion des produits'
      },
      {
        name: 'Catégories Produits',
        description: 'Gestion des catégories de produits par boutique (gérants seulement)'
      },
      {
        name: 'Panier',
        description: 'Gestion du panier d\'achat (acheteurs seulement)'
      },
      {
        name: 'Commandes',
        description: 'Gestion des commandes'
      },
      {
        name: 'Paiements',
        description: 'Gestion des paiements'
      },
      {
        name: 'Statistiques',
        description: 'Statistiques et rapports'
      },
      {
        name: 'Avis',
        description: 'Gestion des avis et commentaires'
      },
      {
        name: 'Favoris',
        description: 'Gestion des favoris (acheteurs seulement)'
      },
      {
        name: 'Administration',
        description: 'Fonctions d\'administration avancées'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Chemin vers vos fichiers de routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = (app) => {
  // Route pour la documentation Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { margin: 20px 0; }
      .swagger-ui .auth-wrapper { margin: 10px 0; }
      .swagger-ui .opblock-tag { font-size: 18px; }
      .opblock-summary-path { font-size: 14px; }
      .try-out { display: block !important; }
    `,
    customSiteTitle: 'API Centre Commercial - Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'method'
    }
  }));
  
  // Route pour récupérer la spécification OpenAPI en JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📚 Documentation Swagger disponible sur: http://localhost:3000/api-docs');
};