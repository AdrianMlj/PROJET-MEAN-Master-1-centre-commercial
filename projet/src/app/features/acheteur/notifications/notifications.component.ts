import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  standalone: false
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerNotifications();
  }

  chargerNotifications(): void {
    this.loading = true;
    this.notificationService.obtenirMesNotifications().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.notifications;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Erreur lors du chargement des notifications';
        this.loading = false;
      }
    });
  }

  marquerCommeLue(notification: Notification): void {
    // Always navigate, only mark as read if not already read
    if (!notification.lu) {
      this.notificationService.marquerCommeLue(notification._id).subscribe({
        next: (response) => {
          if (response.success) {
            notification.lu = true;
          }
          this.naviguerVersNotification(notification);
        },
        error: () => {
          // Still navigate even if marking as read fails
          this.naviguerVersNotification(notification);
        }
      });
    } else {
      // Already read, just navigate
      this.naviguerVersNotification(notification);
    }
  }

  naviguerVersNotification(notification: Notification): void {
    // Navigate based on notification type
    if (notification.donnees?.commandeId) {
      // Check if we need to redirect to payment page
      if (notification.type === 'paiement' || notification.donnees?.action === 'payer') {
        this.router.navigate(['/acheteur/payer', notification.donnees.commandeId]);
      } else if (notification.donnees?.action === 'payer' && notification.donnees?.statut === 'pret') {
        // If order is ready for payment, go to payment page
        this.router.navigate(['/acheteur/payer', notification.donnees.commandeId]);
      } else {
        // Otherwise go to order details
        this.router.navigate(['/acheteur/commande', notification.donnees.commandeId]);
      }
    } else if (notification.donnees?.produitId) {
      this.router.navigate(['/acheteur/produit', notification.donnees.produitId]);
    } else if (notification.type === 'commande') {
      // Default to commandes list for order notifications
      this.router.navigate(['/acheteur/commandes']);
    }
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'commande': 'fa-shopping-bag',
      'paiement': 'fa-credit-card',
      'promotion': 'fa-tag',
      'systeme': 'fa-info-circle'
    };
    return icons[type] || 'fa-bell';
  }

  getTypeClass(type: string): string {
    return `type-${type}`;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return notifDate.toLocaleDateString('fr-FR');
  }

  toutMarquerLues(): void {
    this.notificationService.marquerToutesLues().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications.forEach(n => n.lu = true);
        }
      }
    });
  }
}
