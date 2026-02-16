import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { User } from '../../../core/models/auth.model';

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

  activeTab = 'profil';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
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
}
