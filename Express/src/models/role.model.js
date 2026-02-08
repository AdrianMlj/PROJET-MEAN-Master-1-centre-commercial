const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  nom_role: {
    type: String,
    required: [true, 'Le nom du rôle est requis'],
    unique: true,
    trim: true,
    enum: ['admin_centre', 'boutique', 'acheteur']
  },
  description: {
    type: String,
    trim: true
  },
  permissions: {
    type: [String],
    default: []
  },
  date_creation: {
    type: Date,
    default: Date.now
  },
  date_modification: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'date_creation', updatedAt: 'date_modification' }
});

module.exports = mongoose.model('Role', roleSchema);