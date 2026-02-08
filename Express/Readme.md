POST	/api/utilisateurs/register	
        JTW:  Non
        Role: Public
        {
            "prenom": "Jean",
            "nom": "Dupont",
            "email": "jean@email.com",
            "motDePasse": "123456",
            "roleId": "ROLE_ID"
        }

POST    /api/utilisateurs/login
        JTW:  Non
        Role: Public
        {
            "email": "AdriMa@email.com",
            "motDePasse": "1234567"
        }

        le return
        {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODFmMDU3NDZiMmUzMTU5MDJmMDA3MiIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc3MDEzNTY3NSwiZXhwIjoxNzcwMTM5Mjc1fQ.5OOWOXGfTMLYKLCnXHAgJ8awby6Gpb1-2BIo5GSzZhs",
            "utilisateur": {
                "id": "6981f05746b2e315902f0072",
                "prenom": "AdriannoMaressah",
                "nom": "Razafy",
                "email": "AdriMa@email.com",
                "role": "ADMIN"
            }
        }


GET     /api/utilisateurs
        JTW:  Oui
        Role: Auth
        [
            {
                "_id": "6981e1b42d41989923323731",
                "prenom": "Jean",
                "nom": "Rakoto",
                "email": "dri@commerce.mg",
                "motDePasse": "$2b$10$rDCh1xq.1W1Cje6kTrNdyu2M2Iyy7hVojOxCXJEHOg1ZHa/r9.S3q",
                "role": {
                    "_id": "6981e0e32d41989923323724",
                    "nom": "ADMIN",
                    "permissions": [
                        "ALL"
                    ],
                    "__v": 0
                },
                "actif": true,
                "createdAt": "2026-02-03T11:53:24.125Z",
                "updatedAt": "2026-02-03T11:53:24.125Z",
                "__v": 0
            }
        ]

PUT     /api/utilisateurs/id
        JTW:  Oui
        Role: Auth
        {
            "prenom": "Jean",
            "nom": "Dupont",
            "email": "jean@email.com",
            "motDePasse": "123456",
            "roleId": "ROLE_ID"
        }

DELETE  /api/utilisateurs/id
        JTW:  Oui
        Role: Auth

GET     /api/roles
        JTW:  Non
        Role: Public
        [
            {
                "_id": "6981e0e32d41989923323724",
                "nom": "ADMIN",
                "permissions": [
                    "ALL"
                ],
                "__v": 0
            },
            {
                "_id": "6981e1192d41989923323728",
                "nom": "BOUTIQUE",
                "permissions": [
                    "CRUD_PRODUITS",
                    "GESTION_COMMANDES"
                ],
                "__v": 0
            },
            {
                "_id": "6981e1462d4198992332372b",
                "nom": "ACHETEUR",
                "permissions": [],
                "__v": 0
            },
        ]
        
POST    /api/roles
        JTW:  Oui
        Role: ADMIN
        {
            "nom": "ADMIN",
            "permissions": ["CREATE", "READ", "UPDATE", "DELETE"]
        }


PUT     /api/roles/id
        JTW:  Oui
        Role: ADMIN
        {
            "nom": "ADMIN",
            "permissions": ["CREATE", "READ", "UPDATE", "DELETE"]
        }

DELETE  /api/roles/id
        JTW:  Oui
        Role: ADMIN



