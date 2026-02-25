import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommandeService } from '../../../core/services/commande.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/auth.model';
import { Commande } from '../../../core/models/commande.model';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css'],
  standalone: false
})
export class ProfilComponent implements OnInit {
  profilForm: FormGroup;
  passwordForm: FormGroup;
  currentUser: User | null = null;
  
  loading = true;
  savingProfile = false;
  savingPassword = false;
  
  profileMessage = '';
  profileError = '';
  passwordMessage = '';
  passwordError = '';

  // Statistiques
  stats = {
    totalCommandes: 0,
    totalAchats: 0,
    boutiquesVisitees: 0
  };

  // Orders
  orders: Commande[] = [];
  loadingOrders = false;
  ordersError = '';

  activeTab = 'profil';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private commandeService: CommandeService,
    private http: HttpClient
  ) {
    this.profilForm = this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: [''],
      telephone: [''],
      adresse: this.formBuilder.group({
        rue: [''],
        ville: [''],
        code_postal: [''],
        pays: ['France']
      }),
      preferences: this.formBuilder.group({
        newsletter: [false],
        notifications: [true],
        langue: ['fr']
      })
    });

    this.passwordForm = this.formBuilder.group({
      ancien_mot_de_passe: ['', [Validators.required]],
      nouveau_mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      confirmer_mot_de_passe: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.chargerProfil();
  }

  chargerProfil(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.utilisateur) {
          this.currentUser = response.utilisateur;
          this.profilForm.patchValue({
            nom: response.utilisateur.nom,
            prenom: response.utilisateur.prenom,
            telephone: response.utilisateur.telephone,
            adresse: response.utilisateur.adresse || {},
            preferences: response.utilisateur.preferences || {}
          });
          
          // Charger les stats si disponibles
          if (response.statistiques) {
            this.stats = response.statistiques;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.profileError = error.error?.message || 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });

    // Charger les commandes des le debut pour les statistiques
    this.chargerCommandes();
  }

  chargerCommandes(): void {
    this.loadingOrders = true;
    this.ordersError = '';
    
    this.commandeService.obtenirMesCommandes({ limit: 50 }).subscribe({
      next: (response) => {
        if (response.success)
        {
          this.orders = response.docs || [];
          // Calculate stats from orders
          this.stats.totalCommandes = this.orders.length;
          this.stats.totalAchats = this.orders
            .filter(o => o.statut === 'livre')
            .reduce((sum, o) => sum + (o.total || 0), 0);
          // Count unique boutiques
          const boutiqueIds = new Set(this.orders.map(o => o.boutique?._id));
          this.stats.boutiquesVisitees = boutiqueIds.size;
        }
        this.loadingOrders = false;
      },
      error: (error) => {
        this.ordersError = error.error?.message || 'Erreur lors du chargement des commandes';
        this.loadingOrders = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('nouveau_mot_de_passe')?.value;
    const confirmPassword = form.get('confirmer_mot_de_passe')?.value;
    
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  sauvegarderProfil(): void {
    if (this.profilForm.invalid) {
      this.markFormGroupTouched(this.profilForm);
      return;
    }

    this.savingProfile = true;
    this.profileMessage = '';
    this.profileError = '';

    this.http.put<any>(`${environment.apiUrl}/auth/profil`, this.profilForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.profileMessage = 'Profil mis à jour avec succès';
          this.currentUser = response.utilisateur;
        } else {
          this.profileError = response.message;
        }
        this.savingProfile = false;
      },
      error: (error) => {
        this.profileError = error.error?.message || 'Erreur lors de la mise à jour';
        this.savingProfile = false;
      }
    });
  }

  changerMotDePasse(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.savingPassword = true;
    this.passwordMessage = '';
    this.passwordError = '';

    const data = {
      ancien_mot_de_passe: this.passwordForm.value.ancien_mot_de_passe,
      nouveau_mot_de_passe: this.passwordForm.value.nouveau_mot_de_passe
    };

    this.http.put<any>(`${environment.apiUrl}/auth/changer-mot-de-passe`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.passwordMessage = 'Mot de passe modifié avec succès';
          this.passwordForm.reset();
        } else {
          this.passwordError = response.message;
        }
        this.savingPassword = false;
      },
      error: (error) => {
        this.passwordError = error.error?.message || 'Erreur lors du changement de mot de passe';
        this.savingPassword = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.profileMessage = '';
    this.profileError = '';
    this.passwordMessage = '';
    this.passwordError = '';
    
    // Load orders when switching to orders tab
    if (tab === 'commandes' && this.orders.length === 0) {
      this.chargerCommandes();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get adresseForm(): FormGroup {
    return this.profilForm.get('adresse') as FormGroup;
  }

  get preferencesForm(): FormGroup {
    return this.profilForm.get('preferences') as FormGroup;
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'en_attente': 'En attente',
      'en_preparation': 'En preparation',
      'pret': 'Pret',
      'livre': 'Livre',
      'annule': 'Annule',
      'refuse': 'Refuse'
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'en_attente': 'status-pending',
      'en_preparation': 'status-processing',
      'pret': 'status-ready',
      'livre': 'status-delivered',
      'annule': 'status-cancelled',
      'refuse': 'status-cancelled'
    };
    return classes[statut] || '';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
