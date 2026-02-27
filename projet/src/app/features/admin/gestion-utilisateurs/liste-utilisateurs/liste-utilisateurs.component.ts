import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../core/services/user.service';
import { User, UserStats } from '../../../../core/models/user.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-liste-utilisateurs',
  templateUrl: './liste-utilisateurs.component.html',
  styleUrls: ['./liste-utilisateurs.component.css'],
  standalone: false
})
export class ListeUtilisateursComponent implements OnInit {
  utilisateurs: User[] = [];
  filteredUtilisateurs: User[] = [];
  
  // Statistiques
  stats: UserStats = {
    total: 0,
    admins: 0,
    boutiques: 0,
    acheteurs: 0,
    actifs: 0,
    inactifs: 0
  };

  // Pagination
  currentPage = 1;
  limit = 12;
  totalPages = 1;
  totalDocs = 0;
  hasPrevPage = false;
  hasNextPage = false;

  // Filtres
  searchTerm = '';
  selectedRole: string = '';
  selectedStatut: string = '';

  loading = true;
  errorMessage = '';
  successMessage = '';

  // ✅ URL de l'avatar par défaut pour les utilisateurs
  private readonly DEFAULT_AVATAR_URL = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';

  // Options pour les filtres
  roleOptions = [
    { value: '', label: 'Tous les rôles' },
    { value: 'admin_centre', label: 'Administrateurs' },
    { value: 'boutique', label: 'Gérants de boutique' },
    { value: 'acheteur', label: 'Acheteurs' }
  ];

  statutOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actifs' },
    { value: 'inactif', label: 'Inactifs' }
  ];

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.loading = true;
    
    const params: any = {
      page: 1,
      limit: 100
    };

    this.userService.listerUtilisateurs(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.utilisateurs = response.docs;
          this.applyFrontFilters();
          this.calculerStats(this.utilisateurs);
          
          this.totalDocs = this.utilisateurs.length;
          this.totalPages = Math.ceil(this.totalDocs / this.limit);
          this.currentPage = 1;
          this.hasPrevPage = false;
          this.hasNextPage = this.totalPages > 1;
        }
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  applyFrontFilters(): void {
    let filtered = [...this.utilisateurs];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.nom.toLowerCase().includes(term) ||
        (user.prenom && user.prenom.toLowerCase().includes(term)) ||
        user.email.toLowerCase().includes(term)
      );
    }

    if (this.selectedRole) {
      filtered = filtered.filter(user => user.role.nom_role === this.selectedRole);
    }

    if (this.selectedStatut === 'actif') {
      filtered = filtered.filter(user => user.est_actif === true);
    } else if (this.selectedStatut === 'inactif') {
      filtered = filtered.filter(user => user.est_actif === false);
    }

    const start = (this.currentPage - 1) * this.limit;
    const end = start + this.limit;
    this.filteredUtilisateurs = filtered.slice(start, end);
    
    this.totalDocs = filtered.length;
    this.totalPages = Math.ceil(this.totalDocs / this.limit);
    this.hasPrevPage = this.currentPage > 1;
    this.hasNextPage = this.currentPage < this.totalPages;
  }

  calculerStats(users: User[]): void {
    this.stats.total = users.length;
    this.stats.admins = users.filter(u => u.role.nom_role === 'admin_centre').length;
    this.stats.boutiques = users.filter(u => u.role.nom_role === 'boutique').length;
    this.stats.acheteurs = users.filter(u => u.role.nom_role === 'acheteur').length;
    this.stats.actifs = users.filter(u => u.est_actif).length;
    this.stats.inactifs = users.filter(u => !u.est_actif).length;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatut = '';
    this.currentPage = 1;
    this.applyFrontFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyFrontFilters();
  }

  onToggleStatus(user: User): void {
    const action = user.est_actif ? 'désactiver' : 'activer';
    if (confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
      this.userService.toggleActivationUser(user._id).subscribe({
        next: (response) => {
          if (response.success) {
            user.est_actif = !user.est_actif;
            this.successMessage = `Utilisateur ${user.est_actif ? 'activé' : 'désactivé'} avec succès`;
            
            if (user.est_actif) {
              this.stats.actifs++;
              this.stats.inactifs--;
            } else {
              this.stats.actifs--;
              this.stats.inactifs++;
            }
            
            this.applyFrontFilters();
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors du changement de statut';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ?')) {
      this.userService.supprimerUser(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Utilisateur supprimé avec succès';
            this.loadUtilisateurs();
            setTimeout(() => this.successMessage = '', 3000);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Erreur lors de la suppression';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  // ✅ MODIFIÉ: Nouvelle méthode pour obtenir l'URL de l'avatar depuis Cloudinary
  getAvatarUrl(avatarUrl: string | null | undefined): string {
    // Si pas d'avatar, retourner l'image par défaut
    if (!avatarUrl || avatarUrl.trim() === '') {
      return this.DEFAULT_AVATAR_URL;
    }
    return avatarUrl;
  }

  // ✅ MODIFIÉ: Gestion d'erreur d'image - remplace par l'avatar par défaut
  onAvatarError(event: any): void {
    event.target.src = this.DEFAULT_AVATAR_URL;
    event.target.classList.add('default-avatar');
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'admin_centre': return 'role-admin';
      case 'boutique': return 'role-boutique';
      case 'acheteur': return 'role-acheteur';
      default: return '';
    }
  }

  getRoleIcon(role: string): string {
    switch(role) {
      case 'admin_centre': return 'fa-user-shield';
      case 'boutique': return 'fa-store';
      case 'acheteur': return 'fa-shopping-cart';
      default: return 'fa-user';
    }
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'admin_centre': return 'Admin Centre';
      case 'boutique': return 'Gérant Boutique';
      case 'acheteur': return 'Acheteur';
      default: return role;
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSimpleDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getBoutiqueInfo(user: User): string {
    if (!user.boutique_associee) return 'Aucune boutique';
    return `${user.boutique_associee.nom} ${user.boutique_associee.est_active ? '(Active)' : '(Inactive)'}`;
  }
}