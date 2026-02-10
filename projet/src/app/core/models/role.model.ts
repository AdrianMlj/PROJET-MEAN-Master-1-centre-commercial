export interface Role {
  _id: string;
  nom_role: 'admin_centre' | 'boutique' | 'acheteur';
  description?: string;
  permissions: string[];
  date_creation: Date;
  date_modification: Date;
}