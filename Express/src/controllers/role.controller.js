const Role = require('../models/role.model');

exports.listerRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ date_creation: 1 });
    
    res.status(200).json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Erreur liste rôles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rôles',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.obtenirRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé'
      });
    }
    
    res.status(200).json({
      success: true,
      role
    });
  } catch (error) {
    console.error('Erreur rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rôle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.creerRole = async (req, res) => {
  try {
    const { nom_role, description, permissions } = req.body;
    
    // Validation
    if (!nom_role || !['admin_centre', 'boutique', 'acheteur'].includes(nom_role)) {
      return res.status(400).json({
        success: false,
        message: 'Nom de rôle invalide'
      });
    }
    
    // Vérifier si le rôle existe déjà
    const roleExistant = await Role.findOne({ nom_role });
    if (roleExistant) {
      return res.status(400).json({
        success: false,
        message: 'Ce rôle existe déjà'
      });
    }
    
    const nouveauRole = new Role({
      nom_role,
      description: description || '',
      permissions: permissions || []
    });
    
    await nouveauRole.save();
    
    res.status(201).json({
      success: true,
      message: 'Rôle créé avec succès',
      role: nouveauRole
    });
  } catch (error) {
    console.error('Erreur création rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rôle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.modifierRole = async (req, res) => {
  try {
    const { description, permissions } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé'
      });
    }
    
    // Ne pas autoriser la modification des rôles système
    if (['admin_centre', 'boutique', 'acheteur'].includes(role.nom_role)) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier un rôle système'
      });
    }
    
    // Mettre à jour
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    
    await role.save();
    
    res.status(200).json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      role
    });
  } catch (error) {
    console.error('Erreur modification rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du rôle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.supprimerRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé'
      });
    }
    
    // Ne pas autoriser la suppression des rôles système
    if (['admin_centre', 'boutique', 'acheteur'].includes(role.nom_role)) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer un rôle système'
      });
    }
    
    await role.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Rôle supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du rôle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};