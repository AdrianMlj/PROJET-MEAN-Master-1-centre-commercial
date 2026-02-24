export interface Notification {
  _id: string;
  destinataire: string;
  type: string;
  titre: string;
  message: string;
  donnees?: any;
  lu: boolean;
  date_creation: Date;
}

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
}

export interface NotificationCountResponse {
  success: boolean;
  count: number;
}