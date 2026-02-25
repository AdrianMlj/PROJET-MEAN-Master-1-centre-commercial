export interface Notification {
  _id: string;
  destinataire: string;
  type: 'commande' | 'paiement' | 'systeme' | 'promotion';
  titre: string;
  message: string;
  lu: boolean;
  donnees?: any;
  date_creation: Date;
  date_lecture?: Date;
}

export interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  non_lues: number;
}

export interface MarquerLuResponse {
  success: boolean;
  message: string;
}
