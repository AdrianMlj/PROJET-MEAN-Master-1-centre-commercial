const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const uploadsDir = path.join(__dirname, '../../uploads');
const produitsDir = path.join(uploadsDir, 'produits');
const boutiquesDir = path.join(uploadsDir, 'boutiques');
const avatarsDir = path.join(uploadsDir, 'avatars');

[uploadsDir, produitsDir, boutiquesDir, avatarsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // ✅ SOLUTION AMÉLIORÉE - Vérification multiple
    const url = req.originalUrl || req.url;
    
    // 1. Vérifier par le nom du champ (fieldname)
    if (file.fieldname === 'avatar') {
      uploadPath = avatarsDir;
      console.log('👤 Avatar upload vers:', avatarsDir);
    }
    // 2. Vérifier par le chemin de l'URL
    else if (url.includes('/auth/avatar') || url.includes('/utilisateurs')) {
      uploadPath = avatarsDir;
      console.log('👤 Avatar upload vers:', avatarsDir);
    }
    // 3. Vérifier par baseUrl
    else if (req.baseUrl.includes('/produits')) {
      uploadPath = produitsDir;
      console.log('📸 Produit upload vers:', produitsDir);
    }
    else if (req.baseUrl.includes('/boutiques')) {
      uploadPath = boutiquesDir;
      console.log('🏪 Boutique upload vers:', boutiquesDir);
    }
    else if (req.baseUrl.includes('/utilisateurs')) {
      uploadPath = avatarsDir;
      console.log('👤 Utilisateur upload vers:', avatarsDir);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    
    // ✅ Garder le nom original du champ (avatar, logo, image, etc.)
    let prefix = file.fieldname;
    if (file.fieldname === 'avatar') {
      prefix = 'avatar';
    }
    
    cb(null, prefix + '-' + uniqueSuffix + ext);
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middlewares spécifiques
exports.uploadProduitImage = upload.single('image');
exports.uploadBoutiqueLogo = upload.single('logo');
exports.uploadAvatar = upload.single('avatar');
exports.uploadMultipleImages = upload.array('images', 5); // max 5 images

// Middleware pour gérer les erreurs d'upload
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. Taille maximale: 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};