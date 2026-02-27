const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fonction pour déterminer le dossier selon le type d'upload
const getFolder = (req, file) => {
  const url = req.originalUrl || req.url;
  
  if (file.fieldname === 'avatar' || url.includes('/auth/avatar') || url.includes('/utilisateurs')) {
    return 'avatars';
  } else if (req.baseUrl?.includes('/produits') || file.fieldname === 'image' || file.fieldname === 'images') {
    return 'produits';
  } else if (req.baseUrl?.includes('/boutiques') || file.fieldname === 'logo') {
    return 'boutiques';
  }
  return 'misc';
};

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const folder = getFolder(req, file);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    return {
      folder: `centre-commercial/${folder}`,
      public_id: `${file.fieldname}-${uniqueSuffix}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Redimensionne si trop grand
    };
  }
});

module.exports = { cloudinary, storage };