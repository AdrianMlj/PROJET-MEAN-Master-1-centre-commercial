const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Filtre des fichiers (inchangé)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase().split(' ').join('').split('.').pop());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuration de Multer avec Cloudinary
const upload = multer({
  storage: storage,  // Cloudinary storage
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Middlewares spécifiques (inchangés)
exports.uploadProduitImage = upload.single('image');
exports.uploadBoutiqueLogo = upload.single('logo');
exports.uploadAvatar = upload.single('avatar');
exports.uploadMultipleImages = upload.array('images', 5);

// Middleware pour gérer les erreurs d'upload (adapté)
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