import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { Notification } from '../../../core/models/notification.model';

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  standalone: false
})
export class AdminNotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.notifications;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des notifications';
        this.loading = false;
        console.error(error);
      }
    });
  }

  marquerCommeLue(notif: Notification): void {
    if (notif.lu) return;
    this.notificationService.marquerCommeLue(notif._id).subscribe({
      next: () => {
        notif.lu = true;
        // Mettre à jour le compteur dans la sidebar (optionnel)
      },
      error: (err) => console.error('Erreur', err)
    });
  }

  marquerToutesLues(): void {
    this.notificationService.marquerToutesLues().subscribe({
      next: () => {
        this.notifications.forEach(n => n.lu = true);
      },
      error: (err) => console.error('Erreur', err)
    });
  }

  formaterDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getIcone(type: string): string {
    switch (type) {
      case 'paiement_location': return 'fa-credit-card';
      case 'commande': return 'fa-shopping-cart';
      case 'nouvelle_boutique': return 'fa-store';
      case 'alerte': return 'fa-exclamation-triangle';
      default: return 'fa-bell';
    }
  }

  getCouleur(type: string): string {
    switch (type) {
      case 'paiement_location': return '#4caf50';
      case 'commande': return '#2196f3';
      case 'nouvelle_boutique': return '#ff9800';
      case 'alerte': return '#f44336';
      default: return '#667eea';
    }
  }

  voirDetails(notif: Notification): void {
    if (!notif.donnees) return;
    
    // Navigation selon le type de notification
    if (notif.type === 'paiement_location' && notif.donnees.boutiqueId) {
      this.router.navigate(['/admin/boutiques/boutiques/details', notif.donnees.boutiqueId]);
    }
    // Ajouter d'autres cas si nécessaire
  }
}