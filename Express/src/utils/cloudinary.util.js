const cloudinary = require('cloudinary').v2;

/**
 * Extrait le public_id d'une URL Cloudinary
 * @param {string} url - L'URL complète Cloudinary
 * @returns {string|null} - Le public_id ou null si non trouvé
 */
exports.extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v123456/centre-commercial/avatars/avatar-123456.jpg
    const urlParts = url.split('/');
    const versionIndex = urlParts.findIndex(part => part.startsWith('v'));
    
    if (versionIndex === -1) return null;
    
    // Prendre tout après le numéro de version
    const publicIdWithExtension = urlParts.slice(versionIndex + 1).join('/');
    // Enlever l'extension (.jpg, .png, etc.)
    const publicId = publicIdWithExtension.split('.')[0];
    
    return publicId;
  } catch (error) {
    console.error('❌ Erreur extraction public_id:', error);
    return null;
  }
};

/**
 * Supprime une image de Cloudinary
 * @param {string} publicId - Le public_id de l'image à supprimer
 * @returns {Promise<boolean>} - true si supprimé, false sinon
 */
exports.deleteFromCloudinary = async (publicId) => {
  if (!publicId) return false;
  
  try {
    console.log('🗑️ Suppression de Cloudinary:', publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      console.log('✅ Image supprimée avec succès');
      return true;
    } else {
      console.log('⚠️ Image non trouvée ou déjà supprimée');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur suppression Cloudinary:', error);
    return false;
  }
};

/**
 * Supprime une image à partir de son URL complète
 * @param {string} url - L'URL complète Cloudinary
 * @returns {Promise<boolean>} - true si supprimé, false sinon
 */
exports.deleteImageByUrl = async (url) => {
  const publicId = exports.extractPublicIdFromUrl(url);
  if (publicId) {
    return await exports.deleteFromCloudinary(publicId);
  }
  return false;
};